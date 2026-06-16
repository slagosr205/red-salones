import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {
    AttachMoney,
    Receipt,
    Redeem,
    Stars,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const STATUS_LABELS: Record<string, string> = {
    packaging: 'Empaque',
    in_transit: 'Tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
    packaging: '#ff9800',
    in_transit: '#2196f3',
    delivered: '#4caf50',
    cancelled: '#f44336',
};

type ReportStats = {
    totalOrders: number;
    totalRevenue: number;
    totalPointsEarned: number;
    totalRedemptions: number;
};

type LeaderRow = {
    id: number;
    name: string;
    total: number;
    count: number;
};

type UserRow = {
    id: number;
    name: string;
    role: string;
    total: number;
    count: number;
};

type ProductRow = {
    product_name: string;
    total_qty: number;
    total_revenue: number;
};

type MonthlyRow = {
    month: string;
    total: number;
    count: number;
};

type StatusRow = {
    status: string;
    count: number;
    total: number;
};

type RecentOrder = {
    id: number;
    order_number: string;
    status: string;
    grand_total: number;
    customer_name: string;
    created_at: string;
};

type ReportPageProps = {
    stats: ReportStats;
    salesByLeader: LeaderRow[];
    salesByUser: UserRow[];
    topProducts: ProductRow[];
    monthlyRevenue: MonthlyRow[];
    ordersByStatus: StatusRow[];
    recentOrders: RecentOrder[];
};

export default function ReportsPage() {
    const props = usePage().props as any;
    const { stats, salesByLeader, salesByUser, topProducts, monthlyRevenue, ordersByStatus, recentOrders } = props as ReportPageProps;

    const formatCurrency = (v: number) => `L ${Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <AuthenticatedLayout header="Reportes">
            <Head title="Reportes" />

            <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Card sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Receipt color="primary" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Pedidos</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.totalOrders}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <AttachMoney color="success" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Ingresos</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{formatCurrency(stats.totalRevenue)}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Stars color="warning" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Puntos generados</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.totalPointsEarned}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Redeem color="secondary" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Canjes</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.totalRedemptions}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap>
                    <Card sx={{ flex: '1 1 400px', minWidth: 320 }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>Ingresos mensuales</Typography>
                            {monthlyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                                <Bar dataKey="total" fill="#BFA16B" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No hay datos de ingresos mensuales.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 280px', minWidth: 240 }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>Pedidos por estado</Typography>
                            {ordersByStatus.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => STATUS_LABELS[entry.status ?? entry.name] ?? entry.name}>
                                            {ordersByStatus.map((entry) => (
                                                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#ccc'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No hay pedidos registrados.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Stack>

                <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap>
                    <Card sx={{ flex: '1 1 400px', minWidth: 320 }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>Ventas por líder</Typography>
                            {salesByLeader.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={salesByLeader} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No hay datos de ventas por líder.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 400px', minWidth: 320 }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>Productos más vendidos</Typography>
                            {topProducts.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis type="category" dataKey="product_name" width={140} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v: any) => `${Number(v)} unidades`} />
                                        <Bar dataKey="total_qty" fill="#8C7347" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No hay datos de productos.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Stack>

                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>Ventas por usuario</Typography>
                        {salesByUser.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Nombre</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Rol</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Pedidos</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {salesByUser.map((u) => (
                                            <TableRow key={u.id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={u.role === 'lider' ? 'Líder' : 'Salón'} color={u.role === 'lider' ? 'info' : 'default'} />
                                                </TableCell>
                                                <TableCell align="right">{u.count}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(u.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                No hay datos de ventas por usuario.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>Pedidos recientes</Typography>
                        {recentOrders.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Orden</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Cliente</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Total</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Fecha</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentOrders.map((o) => (
                                            <TableRow key={o.id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{o.order_number}</TableCell>
                                                <TableCell>{o.customer_name}</TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={STATUS_LABELS[o.status] ?? o.status} color={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : o.status === 'in_transit' ? 'info' : 'warning'} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(o.grand_total)}</TableCell>
                                                <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                No hay pedidos recientes.
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Stack>
        </AuthenticatedLayout>
    );
}
