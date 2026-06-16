import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReceiptDialog from '@/Components/ReceiptDialog';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Add, Delete, LocalOffer, Remove, Search } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { refreshActivePromotions, getDiscountForProduct, getPromotionsForProduct, type Promotion } from '@/rc/promotions';
import { addNotification } from '@/rc/notifications';
import { addPointsEvent } from '@/rc/points';
import { getLeaderEmail } from '@/rc/network';

type Customer = {
    id: number;
    name: string;
    email: string;
    role: 'lider' | 'salon';
    client_type: 'salon' | 'consumidor_final' | null;
    leader_id: number | null;
    leader: { id: number; name: string; email: string; role: string } | null;
};

type PosItem = {
    product: any;
    qty: number;
};

type PaymentMethod = 'tc' | 'td' | 'transferencia' | 'efectivo';

function scoreProduct(query: string, p: any): number {
    const q = query.trim().toLowerCase();
    if (!q) return 1;
    const name = p.name?.toLowerCase() ?? '';
    const brand = p.brand?.toLowerCase() ?? '';
    const category = p.category?.toLowerCase() ?? '';
    if (name === q) return 100;
    if (name.startsWith(q)) return 90;
    if (name.includes(q)) return 80;
    if (brand.includes(q)) return 50;
    if (category.includes(q)) return 40;
    return 0;
}

function promoLabel(promo: Promotion): string {
    if (promo.type === '2x1') return '2x1';
    if (promo.type === 'descuento') return `${promo.value}% OFF`;
    if (promo.type === 'combo') return `Combo ${promo.value}%`;
    return '';
}

function promoColor(promo: Promotion): string {
    if (promo.type === '2x1') return '#e91e63';
    if (promo.type === 'descuento') return '#ff9800';
    return '#9c27b0';
}

const paymentLabels: Record<PaymentMethod, string> = {
    tc: 'TC',
    td: 'TD',
    transferencia: 'Transferencia',
    efectivo: 'Efectivo',
};

export default function PosPage() {
    const { auth, customers } = usePage().props as any;
    const userId = auth?.user?.id;

    const defaultCustomer: Customer = { id: 0, name: 'Mostrador', email: '', role: 'salon', client_type: null, leader_id: null, leader: null };

    const [products, setProducts] = useState<any[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [cart, setCart] = useState<PosItem[]>([]);
    const [query, setQuery] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [customer, setCustomer] = useState<Customer>(defaultCustomer);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
    const [amountReceived, setAmountReceived] = useState('');
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptItems, setReceiptItems] = useState<Array<{
        product: any; qty: number; total: number; discount: number;
    }>>([]);
    const [purchasing, setPurchasing] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        Promise.all([
            fetch('/api/catalogo-articulos').then((r) => r.json()),
            refreshActivePromotions().then((p) => {
                setPromotions(p);
                return p;
            }),
        ]).then(([prods]) => setProducts(prods)).catch(() => {});
    }, []);

    const promoMap = useMemo(() => {
        const map = new Map<string, Promotion[]>();
        for (const p of products) {
            const promos = getPromotionsForProduct(p.id);
            if (promos.length > 0) map.set(p.id, promos);
        }
        return map;
    }, [products, promotions]);

    const handleSearchInput = useCallback((_: any, value: string) => {
        setSearchValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setQuery(value), 250);
    }, []);

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 2) return [];
        return products
            .map((p) => ({ p, score: scoreProduct(q, p) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((x) => x.p);
    }, [query, products]);

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter((p) => (q ? scoreProduct(q, p) > 0 : true));
    }, [query, products]);

    const addToCart = (product: any) => {
        setCart((prev) => {
            const idx = prev.findIndex((i) => i.product.id === product.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
                return next;
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const updateQty = (productId: string, qty: number) => {
        setCart((prev) =>
            prev.map((i) =>
                i.product.id === productId ? { ...i, qty: Math.max(1, qty) } : i,
            ),
        );
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const priceTier = useMemo(() => {
        if (customer?.role === 'lider') return 'lider';
        if (customer?.client_type === 'consumidor_final') return 'consumidor_final';
        return 'salon';
    }, [customer]);

    const getUnitPrice = useCallback((product: any) => {
        if (priceTier === 'lider') return product.leader_price ?? product.price ?? 0;
        if (priceTier === 'consumidor_final') return product.public_price ?? product.price ?? 0;
        return product.price ?? 0;
    }, [priceTier]);

    const rows = useMemo(() => {
        return cart.map((ci) => {
            const unitPrice = getUnitPrice(ci.product);
            const discount = getDiscountForProduct(ci.product.id, ci.product.price, ci.qty);
            const promos = getPromotionsForProduct(ci.product.id);
            return {
                ...ci,
                unitPrice,
                total: unitPrice * ci.qty,
                points: (ci.product.points ?? 0) * ci.qty,
                discount,
                promos,
            };
        });
    }, [cart, getUnitPrice]);

    const subtotal = rows.reduce((acc, r) => acc + r.total, 0);
    const totalDiscount = rows.reduce((acc, r) => acc + r.discount, 0);
    const taxable = subtotal - totalDiscount;
    const grandTotal = taxable + taxable * 0.15;
    const pointsEarned = rows.reduce((acc, r) => acc + r.points, 0);
    const received = parseFloat(amountReceived) || 0;
    const change = received - grandTotal;
    const canCheckout = rows.length > 0 && !purchasing &&
        (paymentMethod !== 'efectivo' || received >= grandTotal);

    const handleCheckout = async () => {
        setPurchasing(true);
        const date = new Date().toISOString().slice(0, 10);
        const customerName = customer?.name ?? 'Mostrador';
        const desc = `Venta POS - ${customerName}`;

        const payload: any = {
            items: rows.map((r) => ({
                product_name: r.product.name,
                product_id: r.product.id,
                quantity: r.qty,
                unit_price: r.unitPrice,
                discount: r.discount,
                promo_type: r.promos.length > 0 ? r.promos[0].type : null,
                promo_label: r.promos.length > 0 ? promoLabel(r.promos[0]) : null,
                subtotal: r.total,
            })),
            subtotal,
            total_discount: totalDiscount,
            isv: taxable * 0.15,
            grand_total: grandTotal,
            points_earned: pointsEarned,
            customer_name: customerName,
            customer_email: customer?.email ?? '',
            payment_method: paymentMethod,
        };

        if (paymentMethod === 'efectivo') {
            payload.amount_received = received;
            payload.change = change;
        }

        try {
            await axios.post(route('rc.orders.store'), payload);
        } catch {
            addNotification(userId, 'Error al crear el pedido POS.');
            setPurchasing(false);
            return;
        }

        setReceiptItems(
            rows.map((r) => ({
                product: r.product,
                qty: r.qty,
                total: r.total,
                discount: r.discount,
            })),
        );

        const leaderEmail = getLeaderEmail(customer?.id ? customer : auth?.user);
        addPointsEvent(leaderEmail, {
            date,
            type: 'Compra',
            points: pointsEarned,
            description: desc,
        });
        addNotification(userId, `Venta POS confirmada: ${desc} - L ${subtotal.toFixed(2)}`);
        setCart([]);
        setAmountReceived('');
        setCustomer(defaultCustomer);
        setPaymentMethod('efectivo');
        setPurchasing(false);
        setReceiptOpen(true);
    };

    const customerOptions = useMemo(() => {
        const list: Customer[] = customers ? [...customers] : [];
        list.sort((a, b) => {
            if (a.role !== b.role) return a.role === 'lider' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        return list;
    }, [customers]);

    return (
        <AuthenticatedLayout header="Punto de Venta (POS)">
            <Head title="POS" />

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ height: 'calc(100vh - 140px)' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Autocomplete
                        freeSolo
                        value={searchValue}
                        onInputChange={handleSearchInput}
                        options={suggestions}
                        getOptionLabel={(o: any) => (typeof o === 'string' ? o : o.name)}
                        renderOption={(props, o: any) => {
                            const { key, ...rest } = props;
                            const promos = promoMap.get(o.id);
                            return (
                                <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1 }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'grey.100', background: o.image ? `url(${o.image}) center/cover no-repeat` : undefined, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{o.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>{o.brand} &middot; {o.category}</Typography>
                                    </Box>
                                    <Stack alignItems="flex-end" spacing={0.25}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            L {getUnitPrice(o).toFixed(2)}
                                        </Typography>
                                        {promos?.map((pr) => (
                                            <Chip key={pr.id} size="small" icon={<LocalOffer />} label={promoLabel(pr)} sx={{ height: 18, fontSize: 9, bgcolor: promoColor(pr), color: '#fff', '& .MuiChip-icon': { fontSize: 11 } }} />
                                        ))}
                                    </Stack>
                                </Box>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Buscar producto..."
                                slotProps={{
                                    input: {
                                        ...params.InputProps,
                                        startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>),
                                    },
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}
                        onChange={(_, v) => {
                            if (v && typeof v === 'object') {
                                addToCart(v);
                                setSearchValue('');
                                setQuery('');
                            }
                        }}
                        clearOnBlur={false}
                    />

                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <Grid container spacing={1.5}>
                            {list.map((p) => {
                                const promos = promoMap.get(p.id);
                                return (
                                    <Grid key={p.id} item xs={6} sm={4} md={3}>
                                        <Card
                                            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, position: 'relative' }}
                                            onClick={() => addToCart(p)}
                                        >
                                            {promos?.map((pr) => (
                                                <Chip
                                                    key={pr.id}
                                                    size="small"
                                                    icon={<LocalOffer />}
                                                    label={promoLabel(pr)}
                                                    sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1, height: 20, fontSize: 10, fontWeight: 700, bgcolor: promoColor(pr), color: '#fff', '& .MuiChip-icon': { fontSize: 12 } }}
                                                />
                                            ))}
                                            <Box sx={{ aspectRatio: '4/3', bgcolor: 'grey.100', background: p.image ? `url(${p.image}) center/cover no-repeat` : undefined, borderBottom: '1px solid', borderColor: 'divider' }} />
                                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{p.name}</Typography>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                        L {getUnitPrice(p).toFixed(2)}
                                                    </Typography>
                                                    <Chip size="small" label={p.brand} variant="outlined" />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {list.length === 0 && (
                            <Box sx={{ mt: 4, textAlign: 'center' }}>
                                <Typography sx={{ fontWeight: 800 }}>Sin resultados</Typography>
                                <Typography variant="body2" color="text.secondary">Busque un producto para agregar a la venta.</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />

                <Box sx={{ width: { xs: '100%', lg: 420 }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>Venta Actual</Typography>

                    <Autocomplete
                        options={customerOptions}
                        value={customer?.id ? customer : null}
                        onChange={(_, v) => setCustomer(v ?? defaultCustomer)}
                        getOptionLabel={(o: Customer) => {
                            if (o.role === 'lider') return `${o.name} (Líder)`;
                            const tipo = o.client_type === 'consumidor_final' ? 'Consumidor Final' : 'Salón';
                            return `${o.name} (${tipo})`;
                        }}
                        groupBy={(o: Customer) => o.role === 'lider' ? 'Líderes' : (o.client_type === 'consumidor_final' ? 'Consumidores Finales' : 'Salones')}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        renderOption={(props, o: Customer) => {
                            const { key, ...rest } = props;
                            const label = o.role === 'lider' ? 'Líder' : (o.client_type === 'consumidor_final' ? 'Consumidor Final' : 'Salón');
                            return (
                                <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.75 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.name}</Typography>
                                    <Chip size="small" label={label} variant="outlined" />
                                </Box>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField {...params} size="small" placeholder="Seleccionar cliente..." label="Cliente" />
                        )}
                        sx={{ mb: 1.5 }}
                    />

                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip
                            size="small"
                            label={priceTier === 'lider' ? 'Precio: Líder' : priceTier === 'consumidor_final' ? 'Precio: Consumidor Final' : 'Precio: Salón'}
                            color={priceTier === 'lider' ? 'info' : priceTier === 'consumidor_final' ? 'success' : 'primary'}
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                        />
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <ToggleButtonGroup
                            value={paymentMethod}
                            exclusive
                            onChange={(_, v) => v && setPaymentMethod(v)}
                            size="small"
                            fullWidth
                        >
                            {(['efectivo', 'tc', 'td', 'transferencia'] as PaymentMethod[]).map((m) => (
                                <ToggleButton key={m} value={m} sx={{ textTransform: 'none', fontSize: 12 }}>
                                    {paymentLabels[m]}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Stack>

                    {paymentMethod === 'efectivo' && (
                        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                            <TextField
                                size="small"
                                label="Monto recibido"
                                type="number"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                sx={{ flex: 1 }}
                                inputProps={{ min: 0, step: 0.01 }}
                            />
                            <TextField
                                size="small"
                                label="Vuelto"
                                value={received >= grandTotal ? `L ${change.toFixed(2)}` : ''}
                                slotProps={{ input: { readOnly: true } }}
                                sx={{ flex: 1 }}
                            />
                        </Stack>
                    )}

                    <Box sx={{ flex: 1, overflow: 'auto', mb: 1.5 }}>
                        <Stack spacing={1}>
                            {rows.map((r) => (
                                <Card key={r.product.id} variant="outlined">
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{r.product.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    L {r.unitPrice.toFixed(2)}
                                                </Typography>
                                                {r.promos.map((pr: Promotion) => (
                                                    <Chip key={pr.id} size="small" icon={<LocalOffer />} label={promoLabel(pr)} sx={{ ml: 0.5, height: 16, fontSize: 8, bgcolor: promoColor(pr), color: '#fff', '& .MuiChip-icon': { fontSize: 10 } }} />
                                                ))}
                                            </Box>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <IconButton size="small" onClick={() => updateQty(r.product.id, r.qty - 1)}>
                                                    <Remove fontSize="small" />
                                                </IconButton>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={r.qty}
                                                    onChange={(e) => updateQty(r.product.id, Number(e.target.value || 1))}
                                                    inputProps={{ min: 1, style: { width: 44, textAlign: 'center' } }}
                                                    sx={{ '& .MuiOutlinedInput-input': { p: 0.5 } }}
                                                />
                                                <IconButton size="small" onClick={() => updateQty(r.product.id, r.qty + 1)}>
                                                    <Add fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <Stack alignItems="flex-end" spacing={0.25}>
                                                <Typography sx={{ fontWeight: 900 }}>
                                                    L {r.total.toFixed(2)}
                                                </Typography>
                                                {r.discount > 0 && (
                                                    <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                                                        -L {r.discount.toFixed(2)}
                                                    </Typography>
                                                )}
                                            </Stack>
                                            <IconButton size="small" color="error" onClick={() => removeFromCart(r.product.id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>

                        {rows.length === 0 && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Carrito vacio</Typography>
                                <Typography variant="caption" color="text.disabled">Haga clic en un producto para agregarlo</Typography>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                        <Stack spacing={0.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>L {subtotal.toFixed(2)}</Typography>
                            </Stack>
                            {totalDiscount > 0 && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>Descuentos ({rows.filter((r) => r.discount > 0).length} items)</Typography>
                                    <Typography variant="body2" color="error" sx={{ fontWeight: 700 }}>-L {totalDiscount.toFixed(2)}</Typography>
                                </Stack>
                            )}
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">ISV (15%)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>L {(taxable * 0.15).toFixed(2)}</Typography>
                            </Stack>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Total</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>L {grandTotal.toFixed(2)}</Typography>
                            </Stack>
                        </Stack>

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!canCheckout}
                            onClick={handleCheckout}
                            sx={{ mt: 2 }}
                        >
                            {purchasing
                                ? 'Procesando...'
                                : `Cobrar L ${grandTotal.toFixed(2)}`
                            }
                        </Button>
                    </Box>
                </Box>
            </Stack>

            <ReceiptDialog
                open={receiptOpen}
                onClose={() => setReceiptOpen(false)}
                items={receiptItems}
                customerName={customer?.name ?? 'Mostrador'}
                date={new Date().toISOString().slice(0, 10)}
            />
        </AuthenticatedLayout>
    );
}
