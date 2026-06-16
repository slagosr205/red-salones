import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Box, Card, CardContent, Grid, InputAdornment, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { Search, TrendingDown, TrendingUp, AccountBalanceWallet } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';

import { getLeaderEmail } from '@/rc/network';
import { getPointsState, type PointsEvent } from '@/rc/points';

export default function PointsPage() {
    const user = usePage().props.auth.user;
    const leaderEmail = getLeaderEmail(user);

    const [state, setState] = useState(() => getPointsState(leaderEmail));

    useEffect(() => {
        const onChange = () => setState(getPointsState(leaderEmail));
        window.addEventListener('rc_points_changed', onChange);
        return () => window.removeEventListener('rc_points_changed', onChange);
    }, [leaderEmail]);

    const target = 3000;
    const progress = Math.min(100, (state.balance / target) * 100);

    const totalEarned = useMemo(
        () => state.history.filter((e) => e.type === 'Compra').reduce((s, e) => s + e.points, 0),
        [state.history],
    );
    const totalRedeemed = useMemo(
        () => state.history.filter((e) => e.type === 'Canje').reduce((s, e) => s + Math.abs(e.points), 0),
        [state.history],
    );

    const [search, setSearch] = useState('');

    function scorePointsEvent(query: string, e: PointsEvent): number {
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
        if (!search.trim()) return state.history;
        return state.history.filter((e) => scorePointsEvent(search, e) > 0);
    }, [state.history, search]);

    const columns = useMemo<GridColDef<PointsEvent>[]>(
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
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Balance actual
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                    {state.balance} puntos
                                </Typography>
                                <Box sx={{ mt: 1.25 }}>
                                    <LinearProgress variant="determinate" value={progress} />
                                    <Typography variant="caption" color="text.secondary">
                                        Nivel Plata: {state.balance} / {target}
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
                                <Typography sx={{ fontWeight: 900 }}>Proximo beneficio</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Faltan {Math.max(0, target - state.balance)} puntos para alcanzar la meta.
                                </Typography>
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
                                            {state.balance}
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
