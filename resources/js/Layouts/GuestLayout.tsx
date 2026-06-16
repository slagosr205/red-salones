import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { Box, Card, Container, Stack, Typography } from '@mui/material';

function BrandMark() {
    return (
        <Box
            component="img"
            src="/storage/logo.png"
            alt="Logo"
            sx={{
                height: 120,
                width: 'auto',
            }}
        />
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
                                bgcolor: 'primary.main',
                                position: 'relative',
                            }}
                        >
                            <Stack spacing={2}>
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
