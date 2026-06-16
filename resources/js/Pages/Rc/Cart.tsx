import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
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

import PaymentDialog from '@/Components/PaymentDialog';
import ReceiptDialog from '@/Components/ReceiptDialog';
import { clearCart, getCart, removeFromCart, updateQty } from '@/rc/cart';
import { deductStock } from '@/rc/inventory';
import { getDiscountForProduct, getPromotionsForProduct, refreshActivePromotions } from '@/rc/promotions';
import { products as mockProducts } from '@/rc/mock';
import { getLeaderEmail } from '@/rc/network';
import { addNotification } from '@/rc/notifications';
import { addPointsEvent } from '@/rc/points';
import { getReceiptConfig } from '@/rc/receipt';
import type { RcRole } from '@/rc/role';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY ?? '');

const salones = [
    { id: 's-001', name: 'Salon Glam Studio', email: 'glam@salon.hn' },
    { id: 's-002', name: 'Salon Bella Forma', email: 'bella@salon.hn' },
    { id: 's-003', name: 'Salon Nova Beauty', email: 'nova@salon.hn' },
];

function effectivePrice(p: any, role: string): number {
    if (role === 'lider' || role === 'admin') {
        return p.leader_price ?? p.price ?? 0;
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

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [cart, setCartState] = useState(() => getCart());
    const [selectedSalon, setSelectedSalon] = useState(salones[0].id);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [articles, setArticles] = useState<any[]>([]);
    const [imageModal, setImageModal] = useState('');
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
                const unitPrice = effectivePrice(p, userRole);
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
    }, [cart, allProducts, userRole]);

    const subtotal = rows.reduce((acc, r) => acc + r.total, 0);
    const totalDiscount = rows.reduce((acc, r) => acc + discountFor(r.product, r.qty), 0);
    const taxable = subtotal - totalDiscount;
    const grandTotal = taxable + taxable * 0.15;
    const pointsEarned = rows.reduce((acc, r) => acc + r.points, 0);
    const salon = salones.find((s) => s.id === selectedSalon);

    const finalizePurchase = async () => {
        setPurchasing(true);

        const date = new Date().toISOString().slice(0, 10);
        const leaderEmail = getLeaderEmail(user);
        const desc = userRole === 'lider' && salon
            ? `Compra de Lider para ${salon.name}`
            : 'Compra (prototipo)';

        try {
            await axios.post(route('rc.orders.store'), {
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
                payment_method: 'prototype',
            });
        } catch {
            addNotification(userId, 'Error al crear el pedido. Los datos locales se guardaron igualmente.');
        }

        rows.forEach((r) => {
            const ok = deductStock(r.productId, r.qty, `Venta: ${desc}`);
            if (!ok) {
                addNotification(userId, `Stock insuficiente para ${r.product.name}`);
            }
        });

        setReceiptItems(
            rows.map((r) => ({
                product: r.product,
                qty: r.qty,
                total: r.total,
                discount: discountFor(r.product, r.qty),
            })),
        );

        addPointsEvent(leaderEmail, {
            date,
            type: 'Compra',
            points: pointsEarned,
            description: desc,
        });
        addNotification(userId, `Compra confirmada: ${desc} - L ${subtotal.toFixed(2)}`);
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
                        <FormControl size="small" sx={{ mb: 2, minWidth: 280 }}>
                            <InputLabel>Salon destino</InputLabel>
                            <Select
                                value={selectedSalon}
                                label="Salon destino"
                                onChange={(e) => setSelectedSalon(e.target.value)}
                            >
                                {salones.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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
                                {userRole === 'lider' && salon && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="text.secondary">Salon</Typography>
                                        <Typography sx={{ fontWeight: 800 }}>{salon.name}</Typography>
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

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar compra</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Se acreditaran puntos y se limpiara el carrito.
                    </Typography>
                    {userRole === 'lider' && salon && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                            Pedido para: {salon.name}
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
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        <Button fullWidth variant="outlined" startIcon={<CreditCard />} onClick={() => { setConfirmOpen(false); setPaymentOpen(true); }}>
                            Pagar con tarjeta
                        </Button>
                        <Button fullWidth variant="contained" disabled={purchasing} onClick={finalizePurchase}>
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

            <Elements stripe={stripePromise}>
                <PaymentDialog
                    open={paymentOpen}
                    onClose={() => setPaymentOpen(false)}
                    amount={grandTotal}
                    currency="hnl"
                    customerName={userRole === 'lider' && salon ? salon.name : user.name}
                    customerEmail={userRole === 'lider' && salon ? salon.email : user.email}
                    onPaymentSuccess={finalizePurchase}
                />
            </Elements>

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
