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

import { benefits } from '@/rc/mock';
import { getLeaderEmail } from '@/rc/network';
import { addPointsEvent, getPointsState } from '@/rc/points';

export default function RedeemPage() {
    const user = usePage().props.auth.user;
    const leaderEmail = getLeaderEmail(user);

    const [points, setPoints] = useState(() => getPointsState(leaderEmail));

    useEffect(() => {
        const onChange = () => setPoints(getPointsState(leaderEmail));
        window.addEventListener('rc_points_changed', onChange);
        return () => window.removeEventListener('rc_points_changed', onChange);
    }, [leaderEmail]);

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

            <Grid container spacing={2.25}>
                {benefits.map((b) => {
                    const canRedeem = points.balance >= b.pointsCost;
                    return (
                        <Grid key={b.id} item xs={12} sm={6} md={4} lg={3}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flex: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                        <Typography sx={{ fontWeight: 900 }}>{b.title}</Typography>
                                        <Chip size="small" label={b.kind} />
                                    </Stack>
                                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 900 }}>
                                        {b.pointsCost} puntos
                                    </Typography>
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
                                        disabled={!canRedeem}
                                        onClick={() => {
                                            const date = new Date().toISOString().slice(0, 10);
                                            addPointsEvent(leaderEmail, {
                                                date,
                                                type: 'Canje',
                                                points: -b.pointsCost,
                                                description: `Canje: ${b.title} (prototipo)`,
                                            });
                                        }}
                                    >
                                        Canjear
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
