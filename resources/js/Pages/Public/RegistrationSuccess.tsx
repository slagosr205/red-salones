import { Head, Link } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';

export default function RegistrationSuccess() {
    return (
        <>
            <Head title="Registro exitoso" />

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
                            <MarkEmailRead sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                                Registro exitoso
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Hemos enviado tus credenciales al correo que registraste.
                            </Typography>

                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', textAlign: 'left', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Tu cuenta esta pendiente de aprobacion.</strong>
                                    Un lider o administrador debe aprobar tu ingreso antes de que puedas acceder al sistema.
                                    Recibiras un correo cuando seas activado.
                                </Typography>
                            </Box>

                            <Stack spacing={1.5}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    component={Link}
                                    href={route('login')}
                                >
                                    Ir a iniciar sesion
                                </Button>
                                <Button
                                    fullWidth
                                    variant="text"
                                    size="small"
                                    component={Link}
                                    href={route('shop.catalog')}
                                >
                                    Seguir viendo el catalogo
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </>
    );
}