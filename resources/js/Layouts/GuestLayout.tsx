import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { Box, Card, Container, Stack, Typography } from '@mui/material';

function BrandMark() {
    return (
        <Box
            sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                color: 'primary.contrastText',
                background:
                    'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                boxShadow: '0 14px 30px rgba(233,30,99,0.25)',
                fontWeight: 950,
                letterSpacing: -0.5,
            }}
        >
            RC
        </Box>
    );
}

export default function Guest({ children }: PropsWithChildren) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: -120,
                    background:
                        'radial-gradient(circle at 20% 10%, rgba(233,30,99,0.22), transparent 55%), radial-gradient(circle at 85% 20%, rgba(156,39,176,0.18), transparent 60%), radial-gradient(circle at 60% 85%, rgba(233,30,99,0.12), transparent 55%)',
                    filter: 'blur(2px)',
                }}
            />

            <Container
                maxWidth="md"
                sx={{
                    position: 'relative',
                    py: { xs: 4, sm: 6 },
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                }}
            >
                <Card
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: { xs: 3, sm: 4 },
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        sx={{
                            minHeight: { md: 420 },
                        }}
                    >
                        <Box
                            sx={{
                                flexBasis: { md: 360 },
                                p: { xs: 3, sm: 4 },
                                color: 'common.white',
                                background:
                                    'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: 0.35,
                                    background:
                                        'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.20), transparent 55%)',
                                }}
                            />
                            <Stack sx={{ position: 'relative' }} spacing={2}>
                                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <BrandMark />
                                        <Box>
                                            <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                                                Red Comercial
                                            </Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                Salones Profesionales
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Link>
                                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.6 }}>
                                    Compra, fideliza y crece
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.92, maxWidth: 44 }}>
                                    Interfaz rapida y elegante, enfocada en productividad: menos clics, mas control.
                                </Typography>
                            </Stack>
                        </Box>

                        <Box sx={{ flex: 1, p: { xs: 3, sm: 4 }, bgcolor: 'background.paper' }}>
                            {children}
                        </Box>
                    </Stack>
                </Card>
            </Container>
        </Box>
    );
}
