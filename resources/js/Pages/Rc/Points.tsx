import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Box, Card, CardContent, Chip, Grid, InputAdornment, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { Search, TrendingDown, TrendingUp, AccountBalanceWallet, InfoOutlined } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface HistoryEvent {
    id: string;
    date: string;
    type: 'Compra' | 'Canje';
    points: number;
    description: string;
}

interface Benefit {
    id: number;
    title: string;
    kind: string;
    points_cost: number;
    description: string | null;
    image_path: string | null;
}

export default function PointsPage() {
    const { pointsBalance, totalEarned, totalRedeemed, history } = (usePage().props as any) as {
        pointsBalance: number;
        totalEarned: number;
        totalRedeemed: number;
        history: HistoryEvent[];
    };

    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [loadingBenefits, setLoadingBenefits] = useState(true);

    const loadBenefits = useCallback(async () => {
        try {
            const res = await fetch('/api/beneficios');
            const data = await res.json();
            setBenefits(Array.isArray(data) ? data : []);
        } catch {
            setBenefits([]);
        }
        setLoadingBenefits(false);
    }, []);

    useEffect(() => { loadBenefits(); }, [loadBenefits]);

    const nextBenefit = useMemo(() => {
        if (benefits.length === 0) return null;
        const sorted = [...benefits].sort((a, b) => a.points_cost - b.points_cost);
        const firstUnreached = sorted.find((b) => b.points_cost > pointsBalance);
        return firstUnreached ?? sorted[0];
    }, [benefits, pointsBalance]);

    const target = nextBenefit?.points_cost ?? 3000;
    const progress = Math.min(100, (pointsBalance / target) * 100);
    const remaining = Math.max(0, target - pointsBalance);
    const reached = pointsBalance >= target;
    const [search, setSearch] = useState('');

    function scorePointsEvent(query: string, e: HistoryEvent): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const type = e.type?.toLowerCase() ?? '';
        const desc = e.description?.toLowerCase() ?? '';
        if (type === q || type.startsWith(q)) return 100;
        if (type.includes(q)) return 90;
        if (desc.includes(q)) return 80;
        return 0;
    }

    const filteredHistory = useMemo(() => {
        if (!search.trim()) return history;
        return history.filter((e: HistoryEvent) => scorePointsEvent(search, e) > 0);
    }, [history, search]);

    const columns = useMemo<GridColDef<HistoryEvent>[]>(
        () => [
            { field: 'date', headerName: 'Fecha', flex: 1, minWidth: 110 },
            { field: 'type', headerName: 'Tipo', flex: 1, minWidth: 120 },
            {
                field: 'points',
                headerName: 'Puntos',
                flex: 1,
                minWidth: 120,
                valueFormatter: (value) => String(value),
            },
            { field: 'description', headerName: 'Descripcion', flex: 2, minWidth: 220 },
        ],
        [],
    );

    return (
        <AuthenticatedLayout header="Mis Puntos">
            <Head title="Puntos" />

            <Stack spacing={2.5}>
                <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <InfoOutlined />
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Como gana una afiliada
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                                    Acumula puntos con cada compra que realices o que realicen tus clientes. Canjea tus puntos por beneficios exclusivos. Mientras mas compras, mas puntos acumulas.
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Balance actual
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                    {pointsBalance} puntos
                                </Typography>
                                <Box sx={{ mt: 1.25 }}>
                                    <LinearProgress variant="determinate" value={progress} />
                                    <Typography variant="caption" color="text.secondary">
                                        {nextBenefit ? `${nextBenefit.title}: ${pointsBalance} / ${target}` : `${pointsBalance} / ${target}`}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    p: 1.75,
                                    borderRadius: 2,
                                    bgcolor: 'background.default',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    minWidth: { sm: 260 },
                                }}
                            >
                                {loadingBenefits ? (
                                    <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                                ) : nextBenefit ? (
                                    <>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                            <Typography sx={{ fontWeight: 900 }}>Proximo beneficio</Typography>
                                            {reached && <Chip size="small" label="Alcanzado" color="success" />}
                                        </Stack>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                            {nextBenefit.title}
                                        </Typography>
                                        {reached ? (
                                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                                                Te sobran {pointsBalance - target} puntos — puedes canjearlo
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Faltan {remaining} puntos para alcanzar la meta.
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color="text.secondary">
                                            {nextBenefit.points_cost} puntos — {nextBenefit.kind}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography sx={{ fontWeight: 900 }}>Proximo beneficio</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            No hay beneficios disponibles.
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <TrendingUp color="success" />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Puntos acumulados
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            +{totalEarned}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <TrendingDown color="error" />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Canjes realizados
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            -{totalRedeemed}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <AccountBalanceWallet color="primary" />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Balance disponible
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            {pointsBalance}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Card>
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                Historial
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Buscar por tipo, descripcion..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                                    },
                                }}
                                sx={{ minWidth: 240 }}
                            />
                        </Stack>
                        <Box sx={{ height: 420, bgcolor: 'background.paper' }}>
                            <DataGrid
                                rows={filteredHistory}
                                columns={columns}
                                getRowId={(r) => r.id}
                                disableRowSelectionOnClick
                                pageSizeOptions={[5, 10, 25]}
                                initialState={{
                                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </AuthenticatedLayout>
    );
}
