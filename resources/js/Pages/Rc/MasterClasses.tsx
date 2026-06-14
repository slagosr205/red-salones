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
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { masterClasses } from '@/rc/mock';
import { getLeaderEmail } from '@/rc/network';
import { addPointsEvent, getPointsState } from '@/rc/points';

export default function MasterClassesPage() {
    const user = usePage().props.auth.user;
    const leaderEmail = getLeaderEmail(user);

    const [points, setPoints] = useState(() => getPointsState(leaderEmail));

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

            <Grid container spacing={2.25}>
                {masterClasses.map((mc) => {
                    const canEnroll = points.balance >= mc.pointsRequired;
                    return (
                        <Grid key={mc.id} item xs={12} sm={6} md={4} lg={3}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box
                                    sx={{
                                        height: 160,
                                        bgcolor: 'grey.100',
                                        background:
                                            'linear-gradient(135deg, rgba(156,39,176,0.18), rgba(233,30,99,0.10))',
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
        </AuthenticatedLayout>
    );
}
