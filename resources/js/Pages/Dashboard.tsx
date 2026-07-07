import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from '@mui/material';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { LocalShipping } from '@mui/icons-material';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { RcRole } from '@/rc/role';

const COLORS = {
    admin: '#e91e63',
    lider: '#9c27b0',
    salon: '#7c4dff',
    active: '#2e7d32',
    pending: '#ed6c02',
    rejected: '#d32f2f',
};

const PIE_COLORS = ['#e91e63', '#9c27b0', '#7c4dff', '#ff6f00', '#00897b'];

const ORDER_LABELS: Record<string, string> = {
    packaging: 'Empaque',
    in_transit: 'Tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

const ORDER_COLORS: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
    packaging: 'warning',
    in_transit: 'info',
    delivered: 'success',
    cancelled: 'error',
};

type Kpi = { label: string; value: string };
type ChartData = {
    roleDistribution: { name: string; value: number }[];
    statusDistribution: { name: string; value: number }[];
    registrationsOverTime: { month: string; total: number }[];
    salonesPorLider: { leader: string; total: number }[];
    registrationsByDay: { date: string; total: number }[];
};
type RecentUser = { id: number; name: string; email: string; role: string; status: string; created_at: string };
type RecentOrder = { id: number; order_number: string; status: string; grand_total: number; customer_name: string; created_at: string };

export default function Dashboard() {
    const user = usePage().props.auth.user;
    const userRole: RcRole = user.role ?? 'salon';
    const isAdmin = userRole === 'admin';
    const isLider = userRole === 'lider';

    const kpis = (usePage().props as any).kpis as Kpi[];
    const charts = (usePage().props as any).charts as ChartData | null;
    const recentUsers = (usePage().props as any).recentUsers as RecentUser[];
    const recentOrders = (usePage().props as any).recentOrders as RecentOrder[] | undefined;
    const salonesSinLider = (usePage().props as any).salonesSinLider as number;
    const benefits = (usePage().props as any).benefits as Array<{
        id: number;
        title: string;
        kind: string;
        pointsCost: number;
        description: string | null;
        imagePath: string | null;
        targetRole: string | null;
    }> | undefined;

    const [slideIndex, setSlideIndex] = useState(0);
    const autoSlideRef = useRef<ReturnType<typeof setInterval>>();

    const startAutoSlide = useCallback(() => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        if (!benefits || benefits.length <= 1) return;
        autoSlideRef.current = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % (benefits?.length ?? 1));
        }, 2000);
    }, [benefits]);

    useEffect(() => {
        startAutoSlide();
        return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
    }, [startAutoSlide]);

    const goToSlide = (i: number) => {
        setSlideIndex(i);
        startAutoSlide();
    };

    const activeBenefits = benefits?.filter((b) => b.imagePath) ?? [];

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            <Stack spacing={3}>
                {!isAdmin && activeBenefits.length > 0 && (
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: 280,
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        }}
                    >
                        {activeBenefits.map((b, i) => (
                            <Box
                                key={b.id}
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: i === slideIndex ? 1 : 0,
                                    transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1), transform 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: i === slideIndex ? 'scale(1)' : 'scale(1.05)',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
                                    },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={b.imagePath!}
                                    alt={b.title}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 4,
                                        zIndex: 2,
                                    }}
                                >
                                    <Chip
                                        size="small"
                                        label={b.kind}
                                        sx={{
                                            mb: 1.5,
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(8px)',
                                            color: 'common.white',
                                            fontWeight: 700,
                                            fontSize: 11,
                                            border: '1px solid rgba(255,255,255,0.3)',
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 900,
                                            color: 'common.white',
                                            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                                            mb: 0.5,
                                        }}
                                    >
                                        {b.title}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: 'rgba(255,255,255,0.85)',
                                            maxWidth: 600,
                                            textShadow: '0 1px 10px rgba(0,0,0,0.2)',
                                            mb: 1,
                                        }}
                                    >
                                        {b.description}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={`${b.pointsCost} puntos`}
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'common.white',
                                            fontWeight: 800,
                                            fontSize: 12,
                                        }}
                                    />
                                </Box>
                            </Box>
                        ))}
                        {activeBenefits.length > 1 && (
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    position: 'absolute',
                                    bottom: 2,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 3,
                                }}
                            >
                                {activeBenefits.map((_, i) => (
                                    <Box
                                        key={i}
                                        onClick={() => goToSlide(i)}
                                        sx={{
                                            width: i === slideIndex ? 28 : 10,
                                            height: 10,
                                            borderRadius: 5,
                                            bgcolor: i === slideIndex ? 'primary.main' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer',
                                            transition: 'all 400ms ease',
                                            '&:hover': {
                                                bgcolor: i === slideIndex ? 'primary.light' : 'rgba(255,255,255,0.7)',
                                            },
                                        }}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}

                <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
                    {kpis.map((kpi) => (
                        <Card key={kpi.label} sx={{ flex: '1 1 180px', minWidth: 160 }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    {kpi.label}
                                </Typography>
                                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 900 }}>
                                    {kpi.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>

                {isAdmin && charts && (
                    <>
                        <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
                            <Card sx={{ flex: '1 1 320px', minWidth: 280 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                        Distribución por rol
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={charts.roleDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            >
                                                {charts.roleDistribution.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card sx={{ flex: '1 1 320px', minWidth: 280 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                        Estado de cuentas
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={charts.statusDistribution.filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            >
                                                {charts.statusDistribution.filter(d => d.value > 0).map((entry, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={
                                                            entry.name === 'Activos' ? COLORS.active
                                                            : entry.name === 'Pendientes' ? COLORS.pending
                                                            : COLORS.rejected
                                                        }
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {charts.registrationsOverTime.length > 0 && (
                                <Card sx={{ flex: '1 1 400px', minWidth: 320 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                            Registros por mes
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={charts.registrationsOverTime}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip />
                                                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="url(#barGradient)">
                                                    {charts.registrationsOverTime.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>

                        <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
                            {charts.registrationsByDay.length > 0 && (
                                <Card sx={{ flex: '2 1 400px', minWidth: 320 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                            Registros últimos 30 días
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <AreaChart data={charts.registrationsByDay}>
                                                <defs>
                                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#e91e63" stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor="#e91e63" stopOpacity={0.02} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip />
                                                <Area
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke="#e91e63"
                                                    strokeWidth={2}
                                                    fill="url(#areaGradient)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}

                            {charts.salonesPorLider.length > 0 && (
                                <Card sx={{ flex: '1 1 320px', minWidth: 280 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                            Salones por líder
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart
                                                data={charts.salonesPorLider}
                                                layout="vertical"
                                                margin={{ left: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <YAxis
                                                    type="category"
                                                    dataKey="leader"
                                                    tick={{ fontSize: 10 }}
                                                    width={120}
                                                />
                                                <Tooltip />
                                                <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#7c4dff" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>

                        {salonesSinLider > 0 && (
                            <Card>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                            Salones sin líder asignado:
                                        </Typography>
                                        <Chip
                                            label={String(salonesSinLider)}
                                            color="warning"
                                            size="small"
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => router.visit(route('rc.network'))}
                                        >
                                            Asignar
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}

                        {recentUsers.length > 0 && (
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                        Registros recientes
                                    </Typography>
                                    <Stack spacing={1}>
                                        {recentUsers.map((u) => (
                                            <Stack
                                                key={u.id}
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                sx={{
                                                    p: 1,
                                                    borderRadius: 1,
                                                    bgcolor: 'action.hover',
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {u.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {u.email}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        size="small"
                                                        label={u.role}
                                                        sx={{
                                                            bgcolor: u.role === 'admin' ? COLORS.admin
                                                                : u.role === 'lider' ? COLORS.lider
                                                                : COLORS.salon,
                                                            color: 'common.white',
                                                            fontWeight: 600,
                                                            fontSize: 10,
                                                        }}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        color={u.status === 'active' ? 'success' : 'warning'}
                                                        label={u.status}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {isLider && (
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                                Mi red de salones
                            </Typography>
                            {recentUsers.length > 0 ? (
                                <Stack spacing={1}>
                                    {recentUsers.map((u) => (
                                        <Stack
                                            key={u.id}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {u.name}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                color={u.status === 'active' ? 'success' : 'warning'}
                                                label={u.status}
                                            />
                                        </Stack>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Aún no tienes salones asignados.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Acciones rápidas
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {isAdmin ? 'Gestión global del sistema.' : isLider ? 'Gestiona tu red y puntos.' : 'Tus compras y capacitaciones.'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button variant="contained" onClick={() => router.visit(route('rc.products'))}>
                                Comprar
                            </Button>
                            <Button variant="outlined" onClick={() => router.visit(route('rc.cart'))}>
                                Ir al carrito
                            </Button>
                            {(isLider || isAdmin) && (
                                <Button variant="outlined" onClick={() => router.visit(route('rc.orders'))}>
                                    Pedidos
                                </Button>
                            )}
                            {(isLider || isAdmin) && (
                                <Button variant="outlined" onClick={() => router.visit(route('rc.redeem'))}>
                                    Canjear
                                </Button>
                            )}
                            {(isLider || isAdmin) && (
                                <Button variant="outlined" onClick={() => router.visit(route('rc.network'))}>
                                    Mi red
                                </Button>
                            )}
                            <Button variant="outlined" onClick={() => router.visit(route('rc.masterclasses'))}>
                                Capacitaciones
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {recentOrders && recentOrders.length > 0 && (
                    <Card>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <LocalShipping fontSize="small" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                    Pedidos recientes
                                </Typography>
                            </Stack>
                            <Stack spacing={1}>
                                {recentOrders.map((o) => (
                                    <Stack
                                        key={o.id}
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}
                                    >
                                        <Box>
                                            <Link
                                                href={route('rc.orders.show', { id: o.id })}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {o.order_number}
                                                </Typography>
                                            </Link>
                                            <Typography variant="caption" color="text.secondary">
                                                {o.customer_name} — {new Date(o.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                size="small"
                                                label={ORDER_LABELS[o.status] ?? o.status}
                                                color={ORDER_COLORS[o.status] ?? 'default'}
                                            />
                                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                                                L {Number(o.grand_total).toFixed(2)}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Stack>
        </AuthenticatedLayout>
    );
}
