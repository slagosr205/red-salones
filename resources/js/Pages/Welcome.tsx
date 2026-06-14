import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Assessment,
    Groups,
    Inventory2,
    LocalOffer,
    ShoppingCart,
    WorkspacePremium,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || inView) return;

        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) setInView(true);
            },
            { threshold: 0.18, rootMargin: '0px 0px -10% 0px', ...(options || {}) },
        );

        io.observe(el);
        return () => io.disconnect();
    }, [inView, options]);

    return { ref, inView };
}

function SlideIn({
    children,
    delayMs = 0,
}: {
    children: React.ReactNode;
    delayMs?: number;
}) {
    const { ref, inView } = useInView<HTMLDivElement>();

    return (
        <Box
            ref={ref}
            sx={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0px)' : 'translateY(16px)',
                transition:
                    'transform 720ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 720ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                transitionDelay: `${delayMs}ms`,
                willChange: 'transform, opacity',
            }}
        >
            {children}
        </Box>
    );
}

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const heroChips = useMemo(
        () => ['Compra rapida', 'Puntos', 'Canjes', 'Capacitaciones'],
        [],
    );

    return (
        <>
            <Head title="Red Comercial" />

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
                        inset: -180,
                        background:
                            'radial-gradient(circle at 15% 10%, rgba(233,30,99,0.22), transparent 55%), radial-gradient(circle at 90% 15%, rgba(156,39,176,0.18), transparent 60%), radial-gradient(circle at 55% 90%, rgba(233,30,99,0.14), transparent 55%)',
                    }}
                />

                <Container sx={{ position: 'relative', py: { xs: 4, md: 9 } }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        gap={2}
                        sx={{ mb: { xs: 4, md: 7 } }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ userSelect: 'none' }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 3,
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: 'common.white',
                                    background:
                                        'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                                    boxShadow: '0 14px 30px rgba(233,30,99,0.25)',
                                    fontWeight: 950,
                                    letterSpacing: -0.5,
                                }}
                            >
                                RC
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                                    Red Comercial
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Salones Profesionales
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            {auth.user ? (
                                <Button
                                    component={Link}
                                    href={route('dashboard')}
                                    variant="contained"
                                >
                                    Ir al dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        component={Link}
                                        href={route('login')}
                                        variant="outlined"
                                    >
                                        Iniciar sesion
                                    </Button>
                                    <Button
                                        component={Link}
                                        href={route('register')}
                                        variant="contained"
                                        sx={{
                                            background:
                                                'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                                            boxShadow:
                                                '0 18px 40px rgba(233,30,99,0.22)',
                                        }}
                                    >
                                        Crear cuenta
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Stack>

                    <Grid container spacing={3} alignItems="stretch">
                        <Grid item xs={12} md={7}>
                            <Card
                                sx={{
                                    height: '100%',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    background:
                                        'linear-gradient(135deg, rgba(233,30,99,0.12) 0%, rgba(156,39,176,0.06) 100%)',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0.55,
                                        background:
                                            'radial-gradient(circle at 25% 20%, rgba(233,30,99,0.25), transparent 55%), radial-gradient(circle at 80% 70%, rgba(156,39,176,0.18), transparent 55%)',
                                    }}
                                />
                                <CardContent sx={{ position: 'relative', p: { xs: 3, md: 4 } }}>
                                    <Stack spacing={2.25}>
                                        <SlideIn>
                                            <Box>
                                                <Chip
                                                    label="Tema premium para salones"
                                                    color="secondary"
                                                    sx={{ fontWeight: 900 }}
                                                />
                                                <Typography variant="h2" sx={{ mt: 1.75, lineHeight: 1.05 }}>
                                                    Elegancia operativa
                                                    <br />
                                                    para tu salon
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    color="text.secondary"
                                                    sx={{ mt: 1.25, width: '100%' }}
                                                >
                                                    Compra, puntos y capacitaciones con una experiencia fluida.
                                                    Menos friccion, mas resultado.
                                                </Typography>
                                            </Box>
                                        </SlideIn>

                                        <SlideIn delayMs={120}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                                                <Button
                                                    component={Link}
                                                    href={auth.user ? route('dashboard') : route('login')}
                                                    variant="contained"
                                                    size="large"
                                                    sx={{
                                                        background:
                                                            'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                                                        boxShadow:
                                                            '0 18px 40px rgba(233,30,99,0.22)',
                                                        transition:
                                                            'transform 160ms ease, box-shadow 160ms ease',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            boxShadow:
                                                                '0 24px 55px rgba(233,30,99,0.26)',
                                                        },
                                                    }}
                                                >
                                                    {auth.user ? 'Ir al dashboard' : 'Iniciar sesion'}
                                                </Button>

                                                <Button
                                                    component={Link}
                                                    href={auth.user ? route('rc.products') : route('shop.catalog')}
                                                    variant="outlined"
                                                    size="large"
                                                    sx={{
                                                        transition: 'transform 160ms ease',
                                                        '&:hover': { transform: 'translateY(-1px)' },
                                                    }}
                                                >
                                                    {auth.user ? 'Explorar catalogo' : 'Ver catalogo'}
                                                </Button>
                                            </Stack>
                                        </SlideIn>

                                        <SlideIn delayMs={220}>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {heroChips.map((t) => (
                                                    <Chip key={t} label={t} variant="outlined" />
                                                ))}
                                            </Stack>
                                        </SlideIn>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Stack spacing={2} sx={{ height: '100%' }}>
                                <SlideIn delayMs={80}>
                                    <Card
                                        sx={{
                                            flex: 1,
                                            background:
                                                'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,1))',
                                        }}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                                Experiencia tipo tienda
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Todo lo que un salon necesita para comprar y ganar.
                                            </Typography>
                                            <Stack spacing={1.25} sx={{ mt: 2 }}>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <ShoppingCart fontSize="small" />
                                                    <Typography sx={{ fontWeight: 800 }}>Catalogo visual</Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <WorkspacePremium fontSize="small" />
                                                    <Typography sx={{ fontWeight: 800 }}>Puntos y progreso</Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <LocalOffer fontSize="small" />
                                                    <Typography sx={{ fontWeight: 800 }}>Canjes rapidos</Typography>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </SlideIn>

                                <SlideIn delayMs={180}>
                                    <Card sx={{ flex: 1 }}>
                                        <CardContent>
                                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                                Control para crecer
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Lideres y administracion con visibilidad total.
                                            </Typography>
                                            <Stack spacing={1.25} sx={{ mt: 2 }}>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <Groups fontSize="small" />
                                                    <Typography sx={{ fontWeight: 800 }}>Red comercial</Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <Inventory2 fontSize="small" />
                                                    <Typography sx={{ fontWeight: 800 }}>Alertas de inventario</Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <Assessment fontSize="small" />
                                                    <Typography sx={{ fontWeight: 800 }}>Reportes ejecutivos</Typography>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </SlideIn>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2.25} sx={{ mt: { xs: 0, md: 1 } }}>
                        {[
                            {
                                title: 'Catalogo sin tablas',
                                text: 'Tarjetas visuales, filtros rapidos y busqueda instantanea.',
                            },
                            {
                                title: 'Acciones en 3 clics',
                                text: 'Disenado para velocidad: compra, canje e inscripcion rapida.',
                            },
                            {
                                title: 'Feedback elegante',
                                text: 'Confirmaciones claras, estados visibles y experiencia consistente.',
                            },
                        ].map((f) => (
                            <Grid key={f.title} item xs={12} md={4}>
                                <SlideIn delayMs={120}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            transition:
                                                'transform 180ms ease, box-shadow 180ms ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow:
                                                    '0 26px 60px rgba(17, 24, 39, 0.12), 0 2px 10px rgba(17, 24, 39, 0.05)',
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            <Typography sx={{ fontWeight: 950 }}>{f.title}</Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 0.75 }}
                                            >
                                                {f.text}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </SlideIn>
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ mt: 6, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Laravel v{laravelVersion} | PHP v{phpVersion}
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </>
    );
}
