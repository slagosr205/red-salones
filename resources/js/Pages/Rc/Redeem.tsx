import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Grid,
    InputAdornment,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getLeaderEmail } from '@/rc/network';
import { addPointsEvent, getPointsState } from '@/rc/points';

interface Benefit {
    id: number;
    title: string;
    kind: string;
    points_cost: number;
    description: string | null;
    image_path: string | null;
}

export default function RedeemPage() {
    const user = usePage().props.auth.user;
    const leaderEmail = getLeaderEmail(user);

    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [loading, setLoading] = useState(true);
    const [points, setPoints] = useState(() => getPointsState(leaderEmail));
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [search, setSearch] = useState('');
    const [redeeming, setRedeeming] = useState<number | null>(null);

    function scoreBenefit(query: string, b: Benefit): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const title = b.title?.toLowerCase() ?? '';
        const kind = b.kind?.toLowerCase() ?? '';
        const desc = b.description?.toLowerCase() ?? '';
        if (title === q || title.startsWith(q)) return 100;
        if (title.includes(q)) return 90;
        if (kind.includes(q)) return 70;
        if (desc.includes(q)) return 60;
        return 0;
    }

    const filteredBenefits = useMemo(() => {
        if (!search.trim()) return benefits;
        return benefits.filter((b) => scoreBenefit(search, b) > 0);
    }, [benefits, search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/beneficios');
            const data = await res.json();
            setBenefits(Array.isArray(data) ? data : []);
        } catch {
            setBenefits([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const onChange = () => setPoints(getPointsState(leaderEmail));
        window.addEventListener('rc_points_changed', onChange);
        return () => window.removeEventListener('rc_points_changed', onChange);
    }, [leaderEmail]);

    const handleRedeem = async (b: Benefit) => {
        setRedeeming(b.id);
        try {
            const res = await fetch('/api/beneficios/canjear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' },
                body: JSON.stringify({ benefit_id: b.id, points_cost: b.points_cost }),
            });

            if (!res.ok) {
                const err = await res.json();
                setSnackbar({ open: true, message: err.message ?? 'Error al canjear', severity: 'error' });
                return;
            }

            const date = new Date().toISOString().slice(0, 10);
            addPointsEvent(leaderEmail, {
                date,
                type: 'Canje',
                points: -b.points_cost,
                description: `Canje: ${b.title}`,
            });

            setSnackbar({ open: true, message: 'Canje realizado con exito', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Error de conexion', severity: 'error' });
        } finally {
            setRedeeming(null);
        }
    };

    return (
        <AuthenticatedLayout header="Canjes">
            <Head title="Canjes" />

            <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Catalogo de beneficios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Balance actual: <b>{points.balance}</b> puntos
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Buscar por titulo, tipo, descripcion..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                        },
                    }}
                    sx={{ minWidth: 300 }}
                />
                <Typography variant="body2" color="text.secondary">
                    {filteredBenefits.length} de {benefits.length} beneficios
                </Typography>
            </Stack>

            {loading && filteredBenefits.length === 0 && (
                <Typography variant="body2" color="text.secondary">Cargando beneficios...</Typography>
            )}

            <Grid container spacing={2.25}>
                {filteredBenefits.map((b) => {
                    const canRedeem = points.balance >= b.points_cost;
                    return (
                        <Grid key={b.id} item xs={12} sm={6} md={4} lg={3}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flex: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                        <Typography sx={{ fontWeight: 900 }}>{b.title}</Typography>
                                        <Chip size="small" label={b.kind} />
                                    </Stack>
                                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 900 }}>
                                        {b.points_cost} puntos
                                    </Typography>
                                    {b.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {b.description}
                                        </Typography>
                                    )}
                                    <Box sx={{ mt: 1, p: 1.25, borderRadius: 2, bgcolor: 'background.default' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Estado
                                        </Typography>
                                        <Typography sx={{ fontWeight: 800 }}>
                                            {canRedeem ? 'Disponible' : 'Insuficiente'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    <Button
                                        fullWidth
                                        variant={canRedeem ? 'contained' : 'outlined'}
                                        disabled={!canRedeem || redeeming === b.id}
                                        onClick={() => handleRedeem(b)}
                                    >
                                        {redeeming === b.id ? 'Procesando...' : 'Canjear'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {!loading && filteredBenefits.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    {search ? 'Sin resultados para tu busqueda' : 'No hay beneficios disponibles.'}
                </Typography>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AuthenticatedLayout>
    );
}
