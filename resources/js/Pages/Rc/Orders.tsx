import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    InputAdornment,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useMemo, useState } from 'react';
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
    stripe_payment_intent_id: string | null;
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

function scoreOrder(query: string, o: Order): number {
    const q = query.trim().toLowerCase();
    if (!q) return 1;
    const orderNum = o.order_number?.toLowerCase() ?? '';
    const customer = o.customer_name?.toLowerCase() ?? '';
    const salonName = o.salon?.name?.toLowerCase() ?? '';
    const status = o.status?.toLowerCase() ?? '';
    const paymentMethod = o.payment_method?.toLowerCase() ?? '';
    if (orderNum === q || orderNum.startsWith(q)) return 100;
    if (orderNum.includes(q)) return 90;
    if (customer.startsWith(q) || customer.includes(q)) return 80;
    if (salonName.includes(q)) return 70;
    if (status.includes(q) || STATUS_LABELS[o.status]?.toLowerCase().includes(q)) return 60;
    if (paymentMethod.includes(q)) return 50;
    return 0;
}

export default function Orders({ orders }: Props) {
    const user = usePage().props.auth.user;
    const userRole: RcRole = user.role ?? 'salon';
    const isAdmin = userRole === 'admin';

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filtered = useMemo(() => {
        return orders.filter((o) => {
            if (statusFilter && o.status !== statusFilter) return false;
            if (search) return scoreOrder(search, o) > 0;
            return true;
        });
    }, [orders, search, statusFilter]);

    const handleStatusChange = (orderId: number, newStatus: string) => {
        if (!confirm('¿Cambiar el estado de este pedido?')) return;
        router.patch(route('rc.orders.status', { id: orderId }), { status: newStatus });
    };

    return (
        <AuthenticatedLayout header="Pedidos">
            <Head title="Pedidos" />

            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por orden, cliente, estado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                            },
                        }}
                        sx={{ minWidth: 300 }}
                    />
                    <Select
                        size="small"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        displayEmpty
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="">Todos los estados</MenuItem>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <MenuItem key={k} value={k}>{v}</MenuItem>
                        ))}
                    </Select>
                    <Typography variant="body2" color="text.secondary">
                        {filtered.length} de {orders.length} pedidos
                    </Typography>
                </Stack>

                {filtered.length === 0 ? (
                    <Card>
                        <CardContent>
                            <Typography variant="body1" sx={{ fontWeight: 700, textAlign: 'center', py: 4 }}>
                                {search || statusFilter ? 'Sin resultados para tu busqueda' : 'No hay pedidos aún.'}
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((order) => (
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
                                    {isAdmin && NEXT_STATUS[order.status] && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color={NEXT_STATUS[order.status] === 'delivered' ? 'success' : 'info'}
                                            onClick={() => handleStatusChange(order.id, NEXT_STATUS[order.status]!)}
                                        >
                                            Marcar {STATUS_LABELS[NEXT_STATUS[order.status]!].toLowerCase()}
                                        </Button>
                                    )}
                                    {order.status === 'packaging' && isAdmin && (
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
