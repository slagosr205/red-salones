import { Head, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Delete, ShoppingCart } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';

import { clearCart, getCart, removeFromCart, updateQty } from '@/rc/cart';
import { products as mockProducts } from '@/rc/mock';
import { getLeaderEmail } from '@/rc/network';
import { addPointsEvent } from '@/rc/points';

function effectivePrice(p: any, role: string | null, clientType?: string | null): number {
    if (!role) {
        return p.public_price ?? p.price ?? 0;
    }
    if (role === 'lider' || role === 'admin') {
        return p.leader_price ?? p.price ?? 0;
    }
    if (clientType === 'consumidor_final') {
        return p.public_price ?? p.price ?? 0;
    }
    return p.price ?? 0;
}

export default function PublicCart() {
    const auth = (usePage().props as any).auth;
    const user = auth?.user ?? null;
    const userRole: string | null = user?.role ?? null;
    const userClientType = user?.client_type;

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cart, setCartState] = useState(() => getCart());
    const [articles, setArticles] = useState<any[]>([]);
    const [imageModal, setImageModal] = useState('');

    useEffect(() => {
        fetch('/api/catalogo-articulos')
            .then((r) => r.json())
            .then(setArticles)
            .catch(() => {});
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
                return {
                    ...ci,
                    product: p,
                    total: effectivePrice(p, userRole, userClientType) * ci.qty,
                    points: p.points * ci.qty,
                };
            })
            .filter(Boolean) as Array<{
            productId: string;
            qty: number;
            product: any;
            total: number;
            points: number;
        }>;
    }, [cart, allProducts]);

    const subtotal = rows.reduce((acc, r) => acc + r.total, 0);
    const pointsEarned = rows.reduce((acc, r) => acc + r.points, 0);

    const goLoginForCheckout = () => {
        router.visit(`${route('login')}?redirect=${encodeURIComponent(route('shop.cart'))}`);
    };

    return (
        <>
            <Head title="Carrito" />

            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 3, md: 5 } }}>
                <Container>
                    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'flex-end' }} justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                            <Typography variant="h4">Carrito</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Puedes armar tu carrito sin iniciar sesion. Para confirmar compra, debes iniciar sesion.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button variant="outlined" onClick={() => router.visit(route('shop.catalog'))}>
                                Seguir comprando
                            </Button>
                            {user ? (
                                <Button variant="outlined" onClick={() => router.visit(route('dashboard'))}>
                                    Ir al dashboard
                                </Button>
                            ) : (
                                <Button variant="outlined" onClick={goLoginForCheckout}>
                                    Iniciar sesion
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="flex-start">
                        <Box sx={{ flex: 1, width: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <ShoppingCart />
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                        Tu carrito
                                    </Typography>
                                </Stack>
                                <Button variant="outlined" disabled={rows.length === 0} onClick={() => clearCart()}>
                                    Vaciar
                                </Button>
                            </Stack>

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
                                                        L {effectivePrice(r.product, userRole, userClientType).toFixed(2)} | {r.product.points} puntos
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
                                    <Button sx={{ mt: 2 }} variant="contained" onClick={() => router.visit(route('shop.catalog'))}>
                                        Ir al catalogo
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ width: { xs: '100%', lg: 360 }, position: { lg: 'sticky' }, top: 24 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                        Resumen
                                    </Typography>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Stack spacing={1}>
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
                                        onClick={() => {
                                            if (!user) {
                                                goLoginForCheckout();
                                                return;
                                            }
                                            setConfirmOpen(true);
                                        }}
                                    >
                                        Confirmar compra
                                    </Button>
                                    {!user && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            Inicia sesion para confirmar la compra.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    </Stack>

                    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                        <DialogTitle>Confirmar compra</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" color="text.secondary">
                                Compra prototipo: se acreditaran puntos y se limpiara el carrito.
                            </Typography>
                            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                                <Typography sx={{ fontWeight: 900 }}>Total: L {subtotal.toFixed(2)}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Puntos: +{pointsEarned}
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    const date = new Date().toISOString().slice(0, 10);
                                    const owner = user ? getLeaderEmail(user) : 'public';
                                    addPointsEvent(owner, {
                                        date,
                                        type: 'Compra',
                                        points: pointsEarned,
                                        description: 'Compra (prototipo)',
                                    });
                                    clearCart();
                                    setConfirmOpen(false);
                                }}
                            >
                                Confirmar
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            </Box>

            <Dialog open={!!imageModal} onClose={() => setImageModal('')}>
                {imageModal && (
                    <Box
                        component="img"
                        src={imageModal}
                        sx={{ width: 450, height: 450, objectFit: 'cover', display: 'block' }}
                    />
                )}
            </Dialog>
        </>
    );
}
