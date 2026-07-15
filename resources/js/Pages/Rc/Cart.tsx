import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { CreditCard, Delete } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';

import LocationPicker from '@/Components/LocationPicker';
import TodoPagoPaymentDialog from '@/Components/TodoPagoPaymentDialog';
import ReceiptDialog from '@/Components/ReceiptDialog';
import { clearCart, getCart, removeFromCart, updateQty } from '@/rc/cart';
import { getDiscountForProduct, getPromotionsForProduct, refreshActivePromotions } from '@/rc/promotions';
import { products as mockProducts } from '@/rc/mock';
import { addNotification } from '@/rc/notifications';
import { toastSuccess, toastError } from '@/rc/toast';
import { getReceiptConfig } from '@/rc/receipt';
import type { RcRole } from '@/rc/role';

type CustomerOption = {
    id: number;
    name: string;
    email: string;
    role: 'lider' | 'salon';
    client_type: 'salon' | 'consumidor_final' | null;
};

type PurchaseType = 'personal' | 'salon' | 'consumidor_final';

function effectivePrice(p: any, role: string, clientType?: string | null, purchaseType?: PurchaseType | null): number {
    if (role === 'admin') {
        return p.leader_price ?? p.price ?? 0;
    }
    if (role === 'lider') {
        if (purchaseType === 'salon') return p.price ?? 0;
        if (purchaseType === 'consumidor_final') return p.public_price ?? p.price ?? 0;
        return p.leader_price ?? p.price ?? 0;
    }
    if (clientType === 'consumidor_final') {
        return p.public_price ?? p.price ?? 0;
    }
    return p.price ?? 0;
}

function discountFor(p: { id: string; price: number } & Record<string, any>, q: number) {
    return getDiscountForProduct(p.id, p.price, q);
}

export default function CartPage() {
    const user = usePage().props.auth.user;
    const userId = user.id;
    const userRole: RcRole = user.role ?? 'salon';
    const userClientType = user.client_type;
    const customers = (usePage().props as any).customers as CustomerOption[];

    const salones = useMemo(
        () => customers.filter((c) => c.role === 'salon' && c.client_type !== 'consumidor_final'),
        [customers],
    );
    const consumidoresFinales = useMemo(
        () => customers.filter((c) => c.client_type === 'consumidor_final'),
        [customers],
    );

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [cart, setCartState] = useState(() => getCart());
    const [purchaseType, setPurchaseType] = useState<PurchaseType>(userRole === 'lider' ? 'personal' : 'salon');
    const [selectedSalon, setSelectedSalon] = useState<number>(salones[0]?.id ?? 0);
    const [selectedConsumidor, setSelectedConsumidor] = useState<number>(consumidoresFinales[0]?.id ?? 0);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [articles, setArticles] = useState<any[]>([]);
    const [imageModal, setImageModal] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [shippingLatitude, setShippingLatitude] = useState<number | null>(null);
    const [shippingLongitude, setShippingLongitude] = useState<number | null>(null);
    const [receiptItems, setReceiptItems] = useState<Array<{
        product: any;
        qty: number;
        total: number;
        discount: number;
    }>>([]);

    useEffect(() => {
        Promise.all([
            fetch('/api/catalogo-articulos').then((r) => r.json()),
            refreshActivePromotions(),
        ]).then(([prods]) => setArticles(prods)).catch(() => {});
    }, []);

    useEffect(() => {
        const onChange = () => setCartState(getCart());
        window.addEventListener('rc_cart_changed', onChange);
        return () => window.removeEventListener('rc_cart_changed', onChange);
    }, []);

    const allProducts = useMemo(() => [...articles, ...mockProducts], [articles]);

    const rows = useMemo(() => {
        return cart
            .map((ci) => {
                const p = allProducts.find((x: any) => x.id === ci.productId);
                if (!p) return null;
                const unitPrice = effectivePrice(p, userRole, userClientType, purchaseType);
                return {
                    ...ci,
                    product: p,
                    unitPrice,
                    total: unitPrice * ci.qty,
                    points: p.points * ci.qty,
                };
            })
            .filter(Boolean) as Array<{
            productId: string;
            qty: number;
            product: any;
            unitPrice: number;
            total: number;
            points: number;
        }>;
    }, [cart, allProducts, userRole, userClientType, purchaseType]);

    const subtotal = rows.reduce((acc, r) => acc + r.total, 0);
    const totalDiscount = rows.reduce((acc, r) => acc + discountFor(r.product, r.qty), 0);
    const taxable = subtotal - totalDiscount;
    const grandTotal = taxable + taxable * 0.15;
    const pointsEarned = rows.reduce((acc, r) => acc + r.points, 0);
    const salon = salones.find((s) => s.id === selectedSalon);
    const consumidor = consumidoresFinales.find((c) => c.id === selectedConsumidor);

    const finalizePurchase = async (transaccionId?: number, cardMasked?: string): Promise<boolean> => {
        setPurchasing(true);

        const date = new Date().toISOString().slice(0, 10);
        const desc = userRole === 'lider'
            ? purchaseType === 'salon'
                ? `Compra para salon ${salon?.name ?? ''}`
                : purchaseType === 'consumidor_final'
                    ? `Compra para consumidor final ${consumidor?.name ?? ''}`
                    : 'Compra personal'
            : 'Compra (prototipo)';

        const payload: Record<string, any> = {
            items: rows.map((r) => {
                const promos = getPromotionsForProduct(r.product.id);
                return {
                    product_name: r.product.name,
                    product_id: r.product.id,
                    quantity: r.qty,
                    unit_price: r.unitPrice,
                    discount: discountFor(r.product, r.qty),
                    promo_type: promos.length > 0 ? promos[0].type : null,
                    subtotal: r.total,
                };
            }),
            subtotal,
            total_discount: totalDiscount,
            isv: taxable * 0.15,
            grand_total: grandTotal,
            points_earned: pointsEarned,
            customer_name: user.name,
            customer_email: user.email,
            payment_method: 'todopago',
            todopago_transaccion_id: transaccionId ? String(transaccionId) : null,
            todopago_card_number_masked: cardMasked ?? null,
            shipping_address: shippingAddress.trim() || null,
            shipping_latitude: shippingLatitude,
            shipping_longitude: shippingLongitude,
        };

        if (userRole === 'lider' && purchaseType === 'salon' && salon) {
            payload.salon_id = salon.id;
            payload.customer_name = salon.name;
            payload.customer_email = salon.email;
        }
        if (userRole === 'lider' && purchaseType === 'consumidor_final' && consumidor) {
            payload.customer_name = consumidor.name;
            payload.customer_email = consumidor.email;
        }

        try {
            await axios.post(route('rc.orders.store'), payload);
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Error desconocido';
            console.error('Error al crear pedido:', e?.response ?? e);
            addNotification(userId, 'Error al crear el pedido: ' + msg);
            toastError(msg);
            setPurchasing(false);
            return false;
        }

        setReceiptItems(
            rows.map((r) => ({
                product: r.product,
                qty: r.qty,
                total: r.total,
                discount: discountFor(r.product, r.qty),
            })),
        );

        addNotification(userId, `Compra confirmada: ${desc} - L ${subtotal.toFixed(2)}`);
        toastSuccess(`Compra confirmada: ${desc} - L ${subtotal.toFixed(2)}`);
        clearCart();
        setConfirmOpen(false);
        setPurchasing(false);

        if (userRole === 'salon') {
            const cfg = getReceiptConfig();
            const receiptId = `R-${date.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
            const itemsText = rows
                .map((r) => `  ${r.product.name} x${r.qty} = L ${r.total.toFixed(2)}`)
                .join('\n');
            const subject = encodeURIComponent(`Recibo ${receiptId} - ${cfg.companyName}`);
            const body = encodeURIComponent(
                `${cfg.companyName}\n${cfg.address}\nTel: ${cfg.phone}\n\n` +
                `Recibo: ${receiptId}\nFecha: ${date}\nCliente: ${user.name}\n\n` +
                `--- Productos ---\n${itemsText}\n\n` +
                `Subtotal: L ${subtotal.toFixed(2)}\n` +
                `ISV (15%): L ${(subtotal * 0.15).toFixed(2)}\n` +
                `Total: L ${(subtotal * 1.15).toFixed(2)}\n\n` +
                `Prototipo — sin valor fiscal`,
            );
            window.open(`mailto:${cfg.email}?subject=${subject}&body=${body}`, '_blank');
        } else {
            setReceiptOpen(true);
        }

        return true;
    };

    return (
        <AuthenticatedLayout header="Carrito">
            <Head title="Carrito" />

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="flex-start">
                <Box sx={{ flex: 1, width: '100%' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            Tu carrito
                        </Typography>
                        <Button variant="outlined" disabled={rows.length === 0} onClick={() => clearCart()}>
                            Vaciar
                        </Button>
                    </Stack>

                    {userRole === 'lider' && (
                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 280 }}>
                                <InputLabel>Tipo de compra</InputLabel>
                                <Select
                                    value={purchaseType}
                                    label="Tipo de compra"
                                    onChange={(e) => setPurchaseType(e.target.value as PurchaseType)}
                                >
                                    <MenuItem value="personal">Personal (precio lider)</MenuItem>
                                    <MenuItem value="salon">Para un salon (precio salon)</MenuItem>
                                    <MenuItem value="consumidor_final">Consumidor final (precio publico)</MenuItem>
                                </Select>
                            </FormControl>
                            {purchaseType === 'salon' && (
                                <FormControl size="small" sx={{ minWidth: 280 }}>
                                    <InputLabel>Salon destino</InputLabel>
                                    <Select
                                        value={selectedSalon}
                                        label="Salon destino"
                                        onChange={(e) => setSelectedSalon(Number(e.target.value))}
                                    >
                                        {salones.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            {purchaseType === 'consumidor_final' && (
                                <FormControl size="small" sx={{ minWidth: 280 }}>
                                    <InputLabel>Consumidor destino</InputLabel>
                                    <Select
                                        value={selectedConsumidor}
                                        label="Consumidor destino"
                                        onChange={(e) => setSelectedConsumidor(Number(e.target.value))}
                                    >
                                        {consumidoresFinales.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {c.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Stack>
                    )}

                    <Stack spacing={1.5}>
                        {rows.map((r) => (
                            <Card key={r.productId}>
                                <CardContent>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                                        <Box
                                            onClick={() => r.product.image && setImageModal(r.product.image)}
                                            sx={{
                                                width: 88,
                                                aspectRatio: '4/3',
                                                borderRadius: 2,
                                                bgcolor: 'grey.100',
                                                    background: r.product.image
                                                        ? `url(${r.product.image}) center/cover no-repeat`
                                                        : undefined,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                cursor: r.product.image ? 'pointer' : undefined,
                                            }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 900 }} noWrap>
                                                {r.product.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                L {r.unitPrice.toFixed(2)} | {r.product.points} puntos
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TextField
                                                size="small"
                                                label="Cant."
                                                type="number"
                                                value={r.qty}
                                                onChange={(e) => updateQty(r.productId, Number(e.target.value || 1))}
                                                inputProps={{ min: 1, style: { width: 72 } }}
                                            />
                                            <Typography sx={{ fontWeight: 900, minWidth: 110, textAlign: 'right' }}>
                                                L {r.total.toFixed(2)}
                                            </Typography>
                                            <IconButton aria-label="eliminar" onClick={() => removeFromCart(r.productId)}>
                                                <Delete />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    {rows.length === 0 && (
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 800 }}>Carrito vacio</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Agrega productos desde el catalogo.
                            </Typography>
                            <Button
                                sx={{ mt: 2 }}
                                variant="contained"
                                onClick={() => router.visit(route('rc.products'))}
                            >
                                Ir al catalogo
                            </Button>
                        </Box>
                    )}
                </Box>

                <Box sx={{ width: { xs: '100%', lg: 360 }, position: { lg: 'sticky' }, top: 88 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                Resumen
                            </Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={1}>
                                {userRole === 'lider' && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Tipo</Typography>
                                    <Typography sx={{ fontWeight: 800 }}>
                                        {purchaseType === 'personal' && 'Personal'}
                                        {purchaseType === 'salon' && (salon?.name ?? 'Salon')}
                                        {purchaseType === 'consumidor_final' && (consumidor?.name ?? 'Consumidor final')}
                                    </Typography>
                                </Stack>
                                )}
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography sx={{ fontWeight: 800 }}>L {subtotal.toFixed(2)}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Puntos estimados</Typography>
                                    <Typography sx={{ fontWeight: 800 }}>{pointsEarned}</Typography>
                                </Stack>
                            </Stack>
                            <Button
                                sx={{ mt: 2 }}
                                fullWidth
                                variant="contained"
                                disabled={rows.length === 0}
                                onClick={() => setConfirmOpen(true)}
                            >
                                Confirmar compra
                            </Button>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Prototipo: no procesa pago real.
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Stack>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirmar compra</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Se acreditaran puntos y se limpiara el carrito.
                    </Typography>
                    {userRole === 'lider' && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                            {purchaseType === 'personal' && 'Compra personal (precio lider)'}
                            {purchaseType === 'salon' && `Pedido para: ${salon?.name ?? ''} (precio salon)`}
                            {purchaseType === 'consumidor_final' && `Pedido para: ${consumidor?.name ?? ''} (precio publico)`}
                        </Typography>
                    )}
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography>Subtotal</Typography>
                            <Typography sx={{ fontWeight: 700 }}>L {subtotal.toFixed(2)}</Typography>
                        </Stack>
                        {totalDiscount > 0 && (
                            <Stack direction="row" justifyContent="space-between">
                                <Typography color="error">Dto</Typography>
                                <Typography color="error" sx={{ fontWeight: 700 }}>-L {totalDiscount.toFixed(2)}</Typography>
                            </Stack>
                        )}
                        <Stack direction="row" justifyContent="space-between">
                            <Typography>ISV (15%)</Typography>
                            <Typography sx={{ fontWeight: 700 }}>L {(taxable * 0.15).toFixed(2)}</Typography>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ fontWeight: 900 }}>Total</Typography>
                            <Typography sx={{ fontWeight: 900 }}>L {grandTotal.toFixed(2)}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Puntos: +{pointsEarned}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                            Direccion de entrega
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            placeholder="Escribe la direccion donde se entregara el pedido..."
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                        />
                        <Box sx={{ mt: 1.5 }}>
                            <LocationPicker
                                latitude={shippingLatitude}
                                longitude={shippingLongitude}
                                onChange={(lat, lng) => {
                                    setShippingLatitude(lat);
                                    setShippingLongitude(lng);
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        <Button fullWidth variant="outlined" startIcon={<CreditCard />} onClick={() => { setConfirmOpen(false); setPaymentOpen(true); }}>
                            Pagar con tarjeta
                        </Button>
                        <Button fullWidth variant="contained" disabled={purchasing} onClick={() => finalizePurchase()}>
                            {purchasing ? 'Procesando...' : 'Confirmar (prototipo)'}
                        </Button>
                    </Stack>
                    <Button size="small" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

            <ReceiptDialog
                open={receiptOpen}
                onClose={() => setReceiptOpen(false)}
                items={receiptItems}
                customerName={user.name}
                date={new Date().toISOString().slice(0, 10)}
            />

            <TodoPagoPaymentDialog
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                amount={taxable}
                currency="hnl"
                taxes={taxable * 0.15}
                discount={totalDiscount}
                customerName={
                    userRole === 'lider' && purchaseType === 'salon' && salon ? salon.name
                    : userRole === 'lider' && purchaseType === 'consumidor_final' && consumidor ? consumidor.name
                    : user.name
                }
                customerEmail={
                    userRole === 'lider' && purchaseType === 'salon' && salon ? salon.email
                    : userRole === 'lider' && purchaseType === 'consumidor_final' && consumidor ? consumidor.email
                    : user.email
                }
                onPaymentSuccess={async (transaccionId: number, cardMasked?: string) => {
                    const ok = await finalizePurchase(transaccionId, cardMasked);
                    if (!ok) throw new Error('Error al crear el pedido');
                }}
            />

            <Dialog open={!!imageModal} onClose={() => setImageModal('')}>
                {imageModal && (
                    <Box
                        component="img"
                        src={imageModal}
                        sx={{ width: 450, height: 450, objectFit: 'cover', display: 'block' }}
                    />
                )}
            </Dialog>
        </AuthenticatedLayout>
    );
}
