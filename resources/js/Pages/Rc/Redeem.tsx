import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Grid,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { toastSuccess, toastError } from '@/rc/toast';

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

    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(user.points_balance ?? 0);
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
            const res = await axios.get('/api/beneficios');
            setBenefits(Array.isArray(res.data) ? res.data : []);
        } catch {
            setBenefits([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const onChange = () => {
            // Re-read user prop in case page was re-rendered with new data
            setBalance((usePage().props.auth?.user as any)?.points_balance ?? 0);
        };
        window.addEventListener('rc_points_changed', onChange);
        return () => window.removeEventListener('rc_points_changed', onChange);
    }, []);

    const handleRedeem = async (b: Benefit) => {
        setRedeeming(b.id);
        try {
            const res = await axios.post('/api/beneficios/canjear', { benefit_id: b.id, points_cost: b.points_cost });

            if (res.data.new_balance !== undefined) {
                setBalance(res.data.new_balance);
            } else {
                setBalance((prev) => prev - b.points_cost);
            }

            toastSuccess('Canje realizado con exito');
        } catch {
            toastError('Error de conexion');
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
                    Balance actual: <b>{balance}</b> puntos
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
                    const canRedeem = balance >= b.points_cost;
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
        </AuthenticatedLayout>
    );
}
