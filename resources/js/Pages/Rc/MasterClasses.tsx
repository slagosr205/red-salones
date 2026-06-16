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
import { useEffect, useMemo, useState } from 'react';

import { masterClasses } from '@/rc/mock';
import { getLeaderEmail } from '@/rc/network';
import { addPointsEvent, getPointsState } from '@/rc/points';

export default function MasterClassesPage() {
    const user = usePage().props.auth.user;
    const leaderEmail = getLeaderEmail(user);

    const [search, setSearch] = useState('');
    const [points, setPoints] = useState(() => getPointsState(leaderEmail));

    function scoreMasterClass(query: string, mc: typeof masterClasses[0]): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const title = mc.title?.toLowerCase() ?? '';
        const instructor = mc.instructor?.toLowerCase() ?? '';
        if (title === q || title.startsWith(q)) return 100;
        if (title.includes(q)) return 90;
        if (instructor.includes(q)) return 70;
        return 0;
    }

    const filteredClasses = useMemo(() => {
        if (!search.trim()) return masterClasses;
        return masterClasses.filter((mc) => scoreMasterClass(search, mc) > 0);
    }, [search]);

    useEffect(() => {
        const onChange = () => setPoints(getPointsState(leaderEmail));
        window.addEventListener('rc_points_changed', onChange);
        return () => window.removeEventListener('rc_points_changed', onChange);
    }, [leaderEmail]);

    return (
        <AuthenticatedLayout header="Master Classes">
            <Head title="Master Classes" />

            <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Capacitaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Estilo tipo Netflix. Puntos disponibles: <b>{points.balance}</b>
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Buscar por titulo, instructor..."
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
                    {filteredClasses.length} de {masterClasses.length} clases
                </Typography>
            </Stack>

            <Grid container spacing={2.25}>
                {filteredClasses.map((mc) => {
                    const canEnroll = points.balance >= mc.pointsRequired;
                    return (
                        <Grid key={mc.id} item xs={12} sm={6} md={4} lg={3}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box
                                    sx={{
                                        height: 160,
                                        bgcolor: 'grey.100',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        position: 'relative',
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', left: 12, top: 12 }}>
                                        <Chip size="small" label={mc.modality} />
                                    </Box>
                                </Box>
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 900 }}>{mc.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Instructor: {mc.instructor}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                                        <Chip size="small" variant="outlined" label={mc.date} />
                                        <Chip size="small" variant="outlined" label={`Cupo: ${mc.seats}`} />
                                    </Stack>
                                    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'background.default' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Puntos requeridos
                                        </Typography>
                                        <Typography sx={{ fontWeight: 900 }}>{mc.pointsRequired}</Typography>
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    <Button
                                        fullWidth
                                        variant={canEnroll ? 'contained' : 'outlined'}
                                        disabled={!canEnroll}
                                        onClick={() => {
                                            const date = new Date().toISOString().slice(0, 10);
                                            addPointsEvent(leaderEmail, {
                                                date,
                                                type: 'Canje',
                                                points: -mc.pointsRequired,
                                                description: `Inscripcion: ${mc.title} (prototipo)`,
                                            });
                                        }}
                                    >
                                        Inscribirme
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {filteredClasses.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {search ? 'Sin resultados para tu busqueda' : 'No hay capacitaciones disponibles.'}
                </Typography>
            )}
        </AuthenticatedLayout>
    );
}
