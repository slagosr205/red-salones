import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import type { RcRole } from '@/rc/role';

const STATUS_LABELS: Record<string, string> = {
    packaging: 'Empaque',
    in_transit: 'Tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
    packaging: 'warning',
    in_transit: 'info',
    delivered: 'success',
    cancelled: 'error',
};

const STATUS_STEPS = ['packaging', 'in_transit', 'delivered'];

const NEXT_STATUS: Record<string, string | null> = {
    packaging: 'in_transit',
    in_transit: 'delivered',
    delivered: null,
    cancelled: null,
};

type OrderItem = {
    id: number;
    product_name: string;
    product_id: string | null;
    quantity: number;
    unit_price: number;
    discount: number;
    promo_type: string | null;
    subtotal: number;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    subtotal: number;
    total_discount: number;
    isv: number;
    grand_total: number;
    points_earned: number;
    payment_method: string;
    stripe_payment_intent_id: string | null;
    customer_name: string;
    customer_email: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    user: { id: number; name: string; email: string } | null;
    salon: { id: number; name: string; email: string } | null;
    items: OrderItem[];
};

type Props = {
    order: Order;
};

export default function OrderDetail({ order }: Props) {
    const user = usePage().props.auth.user;
    const userRole: RcRole = user.role ?? 'salon';
    const isAdmin = userRole === 'admin';

    const handleStatusChange = (newStatus: string) => {
        if (!confirm('¿Cambiar el estado de este pedido?')) return;
        router.patch(route('rc.orders.status', { id: order.id }), { status: newStatus });
    };

    const currentStepIndex = STATUS_STEPS.indexOf(order.status);

    return (
        <AuthenticatedLayout header={`Pedido ${order.order_number}`}>
            <Head title={`Pedido ${order.order_number}`} />

            <Stack spacing={2.5}>
                <Button
                    component={Link}
                    href={route('rc.orders')}
                    startIcon={<ArrowBack />}
                    variant="text"
                    sx={{ alignSelf: 'flex-start' }}
                >
                    Volver a pedidos
                </Button>

                <Card>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                    {order.order_number}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Creado: {new Date(order.created_at).toLocaleString()}
                                </Typography>
                            </Box>
                            <Chip
                                label={STATUS_LABELS[order.status] ?? order.status}
                                color={STATUS_COLORS[order.status] ?? 'default'}
                                sx={{ fontWeight: 700, fontSize: 14, px: 1 }}
                            />
                        </Stack>
                    </CardContent>
                </Card>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                Cliente
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {order.customer_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {order.customer_email}
                            </Typography>
                            {order.salon && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Salón destino
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {order.salon.name}
                                    </Typography>
                                </Box>
                            )}
                            {order.user && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Creado por
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {order.user.name}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                Pago
                            </Typography>
                            <Typography variant="body2">
                                Método: {order.payment_method === 'stripe' ? 'Tarjeta' : order.payment_method}
                            </Typography>
                            {order.stripe_payment_intent_id && (
                                <Typography variant="body2" color="text.secondary">
                                    ID: {order.stripe_payment_intent_id}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Stack>

                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                            Estado del pedido
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            {STATUS_STEPS.map((step, i) => (
                                <Stack key={step} direction="row" alignItems="center" spacing={1}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            display: 'grid',
                                            placeItems: 'center',
                                            bgcolor: i <= currentStepIndex ? 'primary.main' : 'grey.300',
                                            color: i <= currentStepIndex ? 'primary.contrastText' : 'grey.600',
                                            fontWeight: 800,
                                            fontSize: 12,
                                        }}
                                    >
                                        {i + 1}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: i <= currentStepIndex ? 700 : 400,
                                            color: i <= currentStepIndex ? 'text.primary' : 'text.secondary',
                                        }}
                                    >
                                        {STATUS_LABELS[step]}
                                    </Typography>
                                    {i < STATUS_STEPS.length - 1 && (
                                        <Box sx={{ width: 24, height: 2, bgcolor: i < currentStepIndex ? 'primary.main' : 'grey.300' }} />
                                    )}
                                </Stack>
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            {NEXT_STATUS[order.status] && (
                                <Button
                                    variant="contained"
                                    color={NEXT_STATUS[order.status] === 'delivered' ? 'success' : 'info'}
                                    onClick={() => handleStatusChange(NEXT_STATUS[order.status]!)}
                                >
                                    Marcar como {STATUS_LABELS[NEXT_STATUS[order.status]!].toLowerCase()}
                                </Button>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleStatusChange('cancelled')}
                                >
                                    Cancelar pedido
                                </Button>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                            Productos
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Cant.</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Precio</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Dto</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.product_name}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">L {Number(item.unit_price).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                {item.discount > 0 ? `L ${Number(item.discount).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                L {Number(item.subtotal).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={0.5} alignItems="flex-end">
                            <Stack direction="row" justifyContent="space-between" sx={{ width: 280 }}>
                                <Typography color="text.secondary">Subtotal</Typography>
                                <Typography sx={{ fontWeight: 700 }}>L {Number(order.subtotal).toFixed(2)}</Typography>
                            </Stack>
                            {Number(order.total_discount) > 0 && (
                                <Stack direction="row" justifyContent="space-between" sx={{ width: 280 }}>
                                    <Typography color="error">Descuento</Typography>
                                    <Typography color="error" sx={{ fontWeight: 700 }}>-L {Number(order.total_discount).toFixed(2)}</Typography>
                                </Stack>
                            )}
                            <Stack direction="row" justifyContent="space-between" sx={{ width: 280 }}>
                                <Typography color="text.secondary">ISV (15%)</Typography>
                                <Typography sx={{ fontWeight: 700 }}>L {Number(order.isv).toFixed(2)}</Typography>
                            </Stack>
                            <Divider sx={{ width: 280 }} />
                            <Stack direction="row" justifyContent="space-between" sx={{ width: 280 }}>
                                <Typography sx={{ fontWeight: 900 }}>Total</Typography>
                                <Typography sx={{ fontWeight: 900 }}>L {Number(order.grand_total).toFixed(2)}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ width: 280 }}>
                                <Typography color="text.secondary">Puntos</Typography>
                                <Typography sx={{ fontWeight: 700 }}>+{order.points_earned}</Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {order.notes && (
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                                Notas
                            </Typography>
                            <Typography variant="body2">{order.notes}</Typography>
                        </CardContent>
                    </Card>
                )}
            </Stack>
        </AuthenticatedLayout>
    );
}
