import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import type { RcRole } from '@/rc/role';

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
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
    customer_name: string;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
    salon: { id: number; name: string; email: string } | null;
    items_count: number;
    items?: OrderItem[];
};

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

const NEXT_STATUS: Record<string, string | null> = {
    packaging: 'in_transit',
    in_transit: 'delivered',
    delivered: null,
    cancelled: null,
};

type Props = {
    orders: Order[];
};

export default function Orders({ orders }: Props) {
    const user = usePage().props.auth.user;
    const userRole: RcRole = user.role ?? 'salon';
    const isAdmin = userRole === 'admin';

    const handleStatusChange = (orderId: number, newStatus: string) => {
        if (!confirm('¿Cambiar el estado de este pedido?')) return;
        router.patch(route('rc.orders.status', { id: orderId }), { status: newStatus });
    };

    return (
        <AuthenticatedLayout header="Pedidos">
            <Head title="Pedidos" />

            <Stack spacing={2}>
                {orders.length === 0 ? (
                    <Card>
                        <CardContent>
                            <Typography variant="body1" sx={{ fontWeight: 700, textAlign: 'center', py: 4 }}>
                                No hay pedidos aún.
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id}>
                            <CardContent>
                                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                                            <Link href={route('rc.orders.show', { id: order.id })} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                {order.order_number}
                                            </Link>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {order.customer_name}
                                            {order.salon && ` — ${order.salon.name}`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(order.created_at).toLocaleDateString()} — {order.items_count} producto(s)
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip
                                            size="small"
                                            label={STATUS_LABELS[order.status] ?? order.status}
                                            color={STATUS_COLORS[order.status] ?? 'default'}
                                        />
                                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                            L {Number(order.grand_total).toFixed(2)}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                    {NEXT_STATUS[order.status] && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color={NEXT_STATUS[order.status] === 'delivered' ? 'success' : 'info'}
                                            onClick={() => handleStatusChange(order.id, NEXT_STATUS[order.status]!)}
                                        >
                                            Marcar {STATUS_LABELS[NEXT_STATUS[order.status]!].toLowerCase()}
                                        </Button>
                                    )}
                                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            color="error"
                                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                    <Button
                                        size="small"
                                        component={Link}
                                        href={route('rc.orders.show', { id: order.id })}
                                    >
                                        Ver detalle
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Stack>
        </AuthenticatedLayout>
    );
}
