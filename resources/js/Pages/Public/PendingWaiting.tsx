import { Head, router, usePage } from '@inertiajs/react';
import { Box, Card, CardContent, Container, Typography } from '@mui/material';
import { HourglassEmpty } from '@mui/icons-material';

export default function PendingWaiting() {
    const user = usePage().props.auth.user;

    return (
        <>
            <Head title="Cuenta pendiente" />

            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                }}
            >
                <Container maxWidth="xs">
                    <Card>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <HourglassEmpty sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                                Cuenta pendiente de aprobacion
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Hola <strong>{user?.name}</strong>, tu cuenta de salon esta siendo revisada.
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Un lider o administrador debe aprobar tu ingreso antes de que puedas
                                acceder al sistema. Recibiras un correo cuando seas aprobado.
                            </Typography>

                            <Box
                                sx={{
                                    mt: 3,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: 'background.default',
                                    textAlign: 'left',
                                }}
                            >
                                <Typography variant="caption" display="block" color="text.secondary">
                                    <strong>Email:</strong> {user?.email}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    <strong>Rol:</strong> Salon
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    <strong>Estado:</strong> Pendiente
                                </Typography>
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3 }}>
                                <button onClick={() => router.post(route('logout'))} style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>Cerrar sesion</button>
                            </Typography>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </>
    );
}
