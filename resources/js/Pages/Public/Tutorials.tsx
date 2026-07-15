import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowBack,
    PlayCircle,
    School,
    Dashboard,
    ShoppingCart,
    Stars,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Chip,
    Divider,
    Stack,
    Typography,
} from '@mui/material';

interface Tutorial {
    id: string;
    number: number;
    title: string;
    description: string;
    videoSrc: string;
    icon: React.ReactNode;
    duration?: string;
}

const tutorials: Tutorial[] = [
    {
        id: 'pagina-inicio',
        number: 1,
        title: 'Bienvenida — Conoce tu Panel',
        description:
            'Aprende a navegar por la plataforma, revisar tu dashboard, productos, pedidos y todas las funcionalidades disponibles para ti como miembro de Red Pro Beauty.',
        videoSrc: '/PaginaInicio.mp4',
        icon: <Dashboard />,
        duration: '5 min',
    },
];

export default function Tutorials() {
    return (
        <>
            <Head title="Tutoriales">
                <meta
                    name="description"
                    content="Aprende a usar Red Pro Beauty con nuestros videos tutoriales guia para afiliados y salones."
                />
            </Head>

            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* ─── Hero Header ─── */}
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        pt: { xs: 6, md: 8 },
                        pb: { xs: 6, md: 8 },
                        background: 'linear-gradient(135deg, #0F4F63 0%, #0a3a4a 50%, #BFA16B 100%)',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -80,
                            right: -80,
                            width: 280,
                            height: 280,
                            borderRadius: '50%',
                            bgcolor: 'rgba(191,161,107,0.12)',
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -60,
                            left: -40,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.04)',
                        },
                    }}
                >
                    <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            variant="text"
                            onClick={() => router.visit(route('shop.catalog'))}
                            sx={{
                                mb: 3,
                                color: 'rgba(255,255,255,0.7)',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Volver al inicio
                        </Button>

                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <School sx={{ color: '#fff', fontSize: 32 }} />
                            </Box>
                            <Chip
                                label="Aprende con nosotros"
                                sx={{
                                    fontWeight: 800,
                                    bgcolor: 'rgba(191,161,107,0.25)',
                                    color: '#fff',
                                    backdropFilter: 'blur(8px)',
                                }}
                            />
                        </Stack>

                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                fontWeight: 950,
                                color: '#fff',
                                lineHeight: 1.1,
                                mb: 1.5,
                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                            }}
                        >
                            Video Tutoriales
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgba(255,255,255,0.75)',
                                maxWidth: 520,
                                lineHeight: 1.7,
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                            }}
                        >
                            Guias paso a paso para que aproveches al maximo cada
                            funcionalidad de la plataforma.
                        </Typography>
                    </Container>
                </Box>

                {/* ─── Tutorials List ─── */}
                <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
                    <Stack spacing={4}>
                        {tutorials.map((tut) => (
                            <Card
                                key={tut.id}
                                sx={{
                                    overflow: 'hidden',
                                    borderRadius: 3,
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'box-shadow 200ms ease',
                                    '&:hover': {
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
                                    },
                                }}
                            >
                                <Box
                                    component="video"
                                    src={tut.videoSrc}
                                    controls
                                    preload="metadata"
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        bgcolor: '#000',
                                        display: 'block',
                                    }}
                                />

                                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 2,
                                                bgcolor: 'primary.main',
                                                color: '#fff',
                                                display: 'grid',
                                                placeItems: 'center',
                                                fontWeight: 900,
                                                fontSize: 18,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {tut.number}
                                        </Box>
                                        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                    {tut.title}
                                                </Typography>
                                                {tut.duration && (
                                                    <Chip
                                                        size="small"
                                                        label={tut.duration}
                                                        sx={{
                                                            fontWeight: 700,
                                                            bgcolor: 'grey.100',
                                                            height: 24,
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ lineHeight: 1.7 }}
                                            >
                                                {tut.description}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}

                        {/* ─── Coming Soon ─── */}
                        <Card
                            sx={{
                                borderRadius: 3,
                                border: '2px dashed',
                                borderColor: 'divider',
                                bgcolor: 'grey.50',
                            }}
                        >
                            <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
                                <Stack spacing={2} alignItems="center">
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: '50%',
                                            bgcolor: 'grey.200',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Stars sx={{ color: 'text.disabled', fontSize: 32 }} />
                                    </Box>
                                    <Stack spacing={0.5}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.secondary' }}>
                                            Mas tutoriales en camino
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Estamos preparando nuevos videos guia sobre pedidos, puntos,
                                            beneficios y mas. Mantente atento.
                                        </Typography>
                                    </Stack>
                                    <Button
                                        component={Link}
                                        href={route('shop.catalog')}
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Explorar catalogo
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Container>
            </Box>
        </>
    );
}
