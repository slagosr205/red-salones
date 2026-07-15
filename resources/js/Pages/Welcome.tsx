import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AutoGraph,
    Diversity3,
    EmojiObjects,
    GroupAdd,
    Handshake,
    LocalOffer,
    Loyalty,
    People,
    Psychology,
    School,
    Star,
    TrendingUp,
    Verified,
    WorkspacePremium,
    Image as ImageIcon,
    Inventory2,
    Email,
    Facebook,
    Instagram,
    YouTube,
    Twitter,
    PlayCircle,
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

import { fetchActivePromotionsWithProducts, getPromotionsForProduct, type PromotionWithProducts } from '@/rc/promotions';

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

function GradientText({ children, variant, component, sx }: { children: React.ReactNode; variant?: string; component?: string; sx?: object }) {
    const props: Record<string, unknown> = {};
    if (variant) props.variant = variant;
    if (component) props.component = component;
    return (
        <Typography
            {...props}
            sx={{
                fontWeight: 950,
                color: 'primary.main',
                ...sx,
            }}
        >
            {children}
        </Typography>
    );
}

const valores = [
    { icon: <Verified />, title: 'Integridad', text: 'Actuamos con honestidad, transparencia y responsabilidad.' },
    { icon: <TrendingUp />, title: 'Crecimiento', text: 'Promovemos el desarrollo continuo de cada miembro de la red.' },
    { icon: <Psychology />, title: 'Liderazgo', text: 'Formamos personas capaces de inspirar y generar cambios positivos.' },
    { icon: <EmojiObjects />, title: 'Innovación', text: 'Buscamos nuevas formas de crear oportunidades para nuestra comunidad.' },
    { icon: <Handshake />, title: 'Colaboración', text: 'Crecemos juntos, compartiendo conocimientos y experiencias.' },
    { icon: <Star />, title: 'Servicio', text: 'Ponemos a las personas en el centro de todo lo que hacemos.' },
];

const perfiles = [
    'Dueños de salones',
    'Estilistas',
    'Barberos',
    'Coloristas',
    'Técnicos capilares',
    'Emprendedores del sector belleza',
];

interface FeaturedArticle {
    id: number;
    name: string;
    brand: string | null;
    category: string | null;
    price: number | null;
    summary: string | null;
    image_path: string | null;
}

function promoLabel(promo: { type: string; value: number }): string {
    if (promo.type === '2x1') return '2x1';
    if (promo.type === 'descuento') return `${promo.value}% OFF`;
    if (promo.type === 'combo') return `Combo ${promo.value}%`;
    return '';
}

function promoColor(promo: { type: string }): string {
    if (promo.type === '2x1') return '#e91e63';
    if (promo.type === 'descuento') return '#ff9800';
    return '#9c27b0';
}

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
    const [promotions, setPromotions] = useState<PromotionWithProducts[]>([]);
    const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());

    useEffect(() => {
        Promise.all([
            axios.get('/api/articulos-destacados').then((res) => setFeaturedArticles(res.data)),
            fetchActivePromotionsWithProducts().then(setPromotions),
        ]).catch(() => {});
    }, []);

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://redprobeauty.hn';

    return (
        <>
            <Head title="Red Pro Beauty">
                <meta name="description" content="Red Pro Beauty — La red comercial de salones de belleza más grande de Honduras. Únete a nuestra red de afiliación, accede a productos profesionales, capacitación y oportunidades de crecimiento para estilistas, barberos y emprendedores del sector belleza." />
                <meta name="keywords" content="salones de belleza, red comercial, afiliación, Honduras, Centroamérica, productos profesionales, estilistas, barberos, Red Pro Beauty, red de salones, belleza Honduras" />
                <meta property="og:title" content="Red Pro Beauty — El Poder de tu Salón" />
                <meta property="og:description" content="Únete a la red de afiliación de salones de belleza más grande de Honduras. Transforma tus recomendaciones en oportunidades de crecimiento." />
                <meta property="og:image" content={`${siteUrl}/storage/banner.png`} />
                <meta property="og:url" content={siteUrl} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Red Pro Beauty — El Poder de tu Salón" />
                <meta name="twitter:description" content="Únete a la red de afiliación de salones de belleza más grande de Honduras." />
                <meta name="twitter:image" content={`${siteUrl}/storage/banner.png`} />
                <link rel="preload" as="image" href="/storage/banner.png" />
            </Head>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        {
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: "Red Pro Beauty",
                            url: siteUrl,
                            logo: `${siteUrl}/storage/logo.png`,
                            description:
                                "Red comercial de salones de belleza en Honduras. Red de afiliación para profesionales de la belleza.",
                            address: {
                                "@type": "PostalAddress",
                                addressLocality: "Tegucigalpa",
                                addressCountry: "HN",
                            },
                            sameAs: [
                                "https://facebook.com/redprobeauty",
                                "https://instagram.com/redprobeauty",
                            ],
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: "Red Pro Beauty",
                            url: siteUrl,
                            description:
                                "Red comercial de salones de belleza en Honduras. Red de afiliación para profesionales de la belleza.",
                        },
                    ]),
                }}
            />

            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.default',
                }}
            >

                {/* ─── Full-width Hero + Nav ─── */}
                    <Box
                        component="header"
                        sx={{
                            position: 'relative',
                            width: '100%',
                            minHeight: { xs: 420, sm: 560, md: 700 },
                            display: 'flex',
                            alignItems: 'center',
                            backgroundImage: 'url(/storage/banner.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0,0,0,0.55)',
                            },
                        }}
                    >
                        <Container maxWidth={false} sx={{ position: 'relative', zIndex: 2, width: '90%', mx: 'auto' }}>
                            {/* ─── Navigation ─── */}
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                gap={2}
                                sx={{ mb: { xs: 4, md: 8 } }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ userSelect: 'none' }}>
                                    <Box
                                        component="img"
                                        src="/storage/logo.png"
                                        alt="Logo"
                                        sx={{
                                            height: 120,
                                            width: 'auto',
                                        }}
                                    />
                                    <Box>
                                        <Typography sx={{ fontWeight: 950, lineHeight: 1.1, color: 'common.white' }}>
                                            Red Pro Beauty
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            El Poder de tu Salón
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Button
                                        component={Link}
                                        href={route('tutorials')}
                                        startIcon={<PlayCircle />}
                                        variant="text"
                                        sx={{
                                            color: 'rgba(255,255,255,0.85)',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                                        }}
                                    >
                                        Tutoriales
                                    </Button>
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
                                                sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'common.white', bgcolor: 'rgba(255,255,255,0.08)' } }}
                                            >
                                                Iniciar sesión
                                            </Button>
                                            <Button
                                                component={Link}
                                                href={route('register')}
                                                variant="contained"
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    boxShadow: '0 18px 40px rgba(233,30,99,0.22)',
                                                }}
                                            >
                                                Crear cuenta
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </Stack>

                            {/* ─── Hero Content ─── */}
                            <Box sx={{ py: { xs: 6, md: 10 } }}>
                                <SlideIn>
                                    <Stack spacing={3} sx={{ maxWidth: 780 }}>
                                        <Chip
                                            label="Campaña: El Poder de tu Salón"
                                            sx={{
                                                fontWeight: 900,
                                                alignSelf: 'flex-start',
                                                bgcolor: 'rgba(233,30,99,0.85)',
                                                color: 'common.white',
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        />
                                        <Typography
                                            variant="h2"
                                            component="h1"
                                            sx={{
                                                lineHeight: 1.08,
                                                color: 'common.white',
                                                fontWeight: 950,
                                                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            Transformando recomendaciones
                                            <br />
                                            en oportunidades de crecimiento
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                maxWidth: 640,
                                                fontWeight: 400,
                                                color: 'rgba(255,255,255,0.8)',
                                                lineHeight: 1.6,
                                                fontSize: { xs: '1rem', md: '1.2rem' },
                                            }}
                                        >
                                            "¿Cuántas veces has recomendado un producto y no has ganado nada
                                            por ello? En Red Pro Beauty creemos que tu recomendación tiene valor."
                                        </Typography>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                            <Button
                                                component={Link}
                                                href={auth.user ? route('dashboard') : route('login')}
                                                variant="contained"
                                                size="large"
                                                sx={{
                                                bgcolor: 'primary.main',
                                                boxShadow: '0 18px 40px rgba(233,30,99,0.22)',
                                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                                                px: 4,
                                                py: 1.5,
                                                fontSize: '1rem',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 24px 55px rgba(233,30,99,0.26)',
                                                },
                                            }}
                                        >
                                            {auth.user ? 'Ir al dashboard' : 'Iniciar sesión'}
                                        </Button>
                                        <Button
                                            component={Link}
                                            href={auth.user ? route('rc.products') : route('shop.catalog')}
                                            variant="outlined"
                                                size="large"
                                                sx={{
                                                    color: 'common.white',
                                                    borderColor: 'rgba(255,255,255,0.4)',
                                                    px: 4,
                                                    py: 1.5,
                                                    fontSize: '1rem',
                                                    transition: 'transform 160ms ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        borderColor: 'common.white',
                                                        bgcolor: 'rgba(255,255,255,0.08)',
                                                    },
                                                }}
                                            >
                                                {auth.user ? 'Explorar catálogo' : 'Ver catálogo'}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </SlideIn>
                            </Box>
                        </Container>
                    </Box>

                    <Container component="main" maxWidth={false} sx={{ flex: 1, position: 'relative', py: { xs: 4, md: 9 }, width: '90%', mx: 'auto' }}>

                    {/* ─── Promociones Activas ─── */}
                    {(() => {
                        const activePromos = promotions.filter((p) => p.type === '2x1' || p.type === 'descuento' || p.type === 'combo');
                        if (activePromos.length === 0) return null;
                        return (
                            <Box component="section" sx={{ mb: 8 }}>
                                <SlideIn>
                                    <Stack spacing={1} sx={{ textAlign: 'center', mb: 3 }}>
                                        <Chip
                                            label="Promociones Activas"
                                            sx={{ fontWeight: 900, alignSelf: 'center', bgcolor: '#e91e63', color: '#fff' }}
                                        />
                                        <Typography variant="h4" sx={{ fontWeight: 950 }}>
                                            Ofertas y Combos Especiales
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Aprovecha nuestras promociones vigentes en productos profesionales.
                                        </Typography>
                                    </Stack>
                                </SlideIn>
                                <Grid container spacing={2.5}>
                                    {activePromos.map((promo, i) => {
                                        const isCombo = promo.type === 'combo';
                                        const is2x1 = promo.type === '2x1';
                                        const isDiscount = promo.type === 'descuento';
                                        const bgColor = is2x1 ? '#e91e63' : isCombo ? '#9c27b0' : '#ff9800';
                                        return (
                                            <Grid key={promo.id} item xs={12} sm={6} md={4}>
                                                <SlideIn delayMs={i * 80}>
                                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'visible' }}>
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: -8,
                                                                right: 16,
                                                                bgcolor: bgColor,
                                                                color: '#fff',
                                                                px: 1.5,
                                                                py: 0.5,
                                                                borderRadius: 1,
                                                                fontWeight: 900,
                                                                fontSize: 14,
                                                                zIndex: 2,
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                            }}
                                                        >
                                                            {is2x1 ? '2x1' : isCombo ? `Combo ${promo.value}%` : `${promo.value}% OFF`}
                                                        </Box>
                                                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                            <Stack spacing={1.5} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 900, pr: 6 }}>
                                                                    {promo.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Vigencia: {new Date(promo.startDate).toLocaleDateString()} — {new Date(promo.endDate).toLocaleDateString()}
                                                                </Typography>
                                                                {is2x1 && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Lleva 2 productos al precio de 1 en productos seleccionados.
                                                                    </Typography>
                                                                )}
                                                                {isDiscount && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {promo.value}% de descuento en productos seleccionados.
                                                                    </Typography>
                                                                )}
                                                                {isCombo && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Combo con {promo.value}% de ahorro en productos seleccionados.
                                                                    </Typography>
                                                                )}
                                                                {promo.products && promo.products.length > 0 && (
                                                                    <Stack spacing={1}>
                                                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                                            Productos incluidos:
                                                                        </Typography>
                                                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                                            {promo.products.slice(0, 4).map((prod) => (
                                                                                <Box
                                                                                    key={prod.id}
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: 0.75,
                                                                                        bgcolor: 'grey.100',
                                                                                        borderRadius: 1,
                                                                                        px: 1,
                                                                                        py: 0.5,
                                                                                    }}
                                                                                >
                                                                                    <Box
                                                                                        sx={{
                                                                                            width: 28,
                                                                                            height: 28,
                                                                                            borderRadius: 0.5,
                                                                                            bgcolor: 'grey.200',
                                                                                            background: prod.image ? `url(${prod.image}) center/cover no-repeat` : undefined,
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            flexShrink: 0,
                                                                                            overflow: 'hidden',
                                                                                        }}
                                                                                    >
                                                                                        {!prod.image && <Inventory2 sx={{ fontSize: 16, color: 'text.disabled' }} />}
                                                                                    </Box>
                                                                                    <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                                                        {prod.name}
                                                                                    </Typography>
                                                                                </Box>
                                                                            ))}
                                                                            {promo.products.length > 4 && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                                                                    +{promo.products.length - 4} más
                                                                                </Typography>
                                                                            )}
                                                                        </Stack>
                                                                    </Stack>
                                                                )}
                                                                <Box sx={{ flex: 1 }} />
                                                                <Button
                                                                    component={Link}
                                                                    href={route('shop.catalog')}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ alignSelf: 'flex-start', fontWeight: 700, borderColor: bgColor, color: bgColor, '&:hover': { borderColor: bgColor, bgcolor: `${bgColor}15` } }}
                                                                >
                                                                    Ver productos
                                                                </Button>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                </SlideIn>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        );
                    })()}

                    {/* ─── Artículos Destacados ─── */}
                    {featuredArticles.length > 0 && (
                        <Box component="section" sx={{ mb: 8 }}>
                            <SlideIn>
                                <Stack spacing={1} sx={{ textAlign: 'center', mb: 3 }}>
                                    <Chip
                                        label="Artículos Destacados"
                                        color="primary"
                                        sx={{ fontWeight: 900, alignSelf: 'center' }}
                                    />
                                    <Typography variant="h4" sx={{ fontWeight: 950 }}>
                                        Productos que recomendamos
                                    </Typography>
                                </Stack>
                            </SlideIn>
                            <Grid container spacing={2.5}>
                                {featuredArticles.map((a, i) => {
                                    const articlePromos = getPromotionsForProduct('art-' + a.id);
                                    return (
                                    <Grid key={a.id} item xs={12} sm={6} md={4}>
                                        <SlideIn delayMs={i * 80}>
                                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                                {articlePromos.map((pr) => (
                                                    <Chip
                                                        key={pr.id}
                                                        size="small"
                                                        icon={<LocalOffer />}
                                                        label={promoLabel(pr)}
                                                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, height: 22, fontSize: 11, fontWeight: 700, bgcolor: promoColor(pr), color: '#fff', '& .MuiChip-icon': { fontSize: 13 } }}
                                                    />
                                                ))}
                                                <Box
                                                    sx={{
                                                        aspectRatio: '4/3',
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        bgcolor: 'grey.100',
                                                        background: a.image_path
                                                            ? `url(/storage/${a.image_path}) center/cover no-repeat`
                                                            : undefined,
                                                        borderBottom: '1px solid',
                                                        borderColor: 'divider',
                                                    }}
                                                >
                                                    {!a.image_path && (
                                                        <Inventory2 sx={{ fontSize: 48, color: 'text.disabled' }} />
                                                    )}
                                                </Box>
                                                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <Stack spacing={1} sx={{ flex: 1 }}>
                                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                            {a.category && <Chip size="small" label={a.category} />}
                                                            {a.brand && <Chip size="small" variant="outlined" label={a.brand} />}
                                                        </Stack>
                                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                            {a.name}
                                                        </Typography>
                                                        {a.summary && (() => {
                                                            const isExpanded = expandedSummaries.has(a.id);
                                                            const shouldTruncate = a.summary.length > 80;
                                                            return (
                                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        sx={{
                                                                            overflow: 'hidden',
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: isExpanded ? 'unset' : 3,
                                                                            WebkitBoxOrient: 'vertical',
                                                                        }}
                                                                    >
                                                                        {a.summary}
                                                                    </Typography>
                                                                    {shouldTruncate && (
                                                                        <Button
                                                                            size="small"
                                                                            sx={{
                                                                                alignSelf: 'flex-start',
                                                                                mt: 0.5,
                                                                                p: 0,
                                                                                minWidth: 0,
                                                                                fontWeight: 700,
                                                                                textTransform: 'none',
                                                                                color: 'primary.main',
                                                                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                                                            }}
                                                                            onClick={() => {
                                                                                setExpandedSummaries((prev) => {
                                                                                    const next = new Set(prev);
                                                                                    if (isExpanded) next.delete(a.id);
                                                                                    else next.add(a.id);
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                        >
                                                                            {isExpanded ? 'Mostrar menos' : 'Leer más'}
                                                                        </Button>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })()}
                                                        {a.price != null && (
                                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                                L {Number(a.price).toFixed(2)}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </SlideIn>
                                    </Grid>
                                );
                            })}
                            </Grid>
                        </Box>
                    )}

                    {/* ─── Nuestra Historia ─── */}
                    <Box component="section" sx={{ mt: 10, mb: 6 }}>
                        <SlideIn>
                            <Stack spacing={2} sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
                                <Chip
                                    label="Nuestra Historia"
                                    color="secondary"
                                    sx={{ fontWeight: 900, alignSelf: 'center' }}
                                />
                                <Typography variant="h4" sx={{ fontWeight: 950 }}>
                                    Una nueva forma de crecer en la{' '}
                                    <GradientText component="span">industria de la belleza</GradientText>
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
                                    Red Pro Beauty nace con la visión de transformar la industria de la
                                    belleza en Honduras a través de un modelo innovador de afiliación,
                                    liderazgo y crecimiento compartido. Creemos que los profesionales de la
                                    belleza generan valor todos los días mediante su experiencia,
                                    recomendaciones y confianza con sus clientes. Por eso creamos una red
                                    donde ese valor puede convertirse en oportunidades de crecimiento
                                    personal, profesional y económico. Más que una red comercial, somos una
                                    comunidad que impulsa a salones de belleza, estilistas y emprendedores a
                                    crecer juntos mediante capacitación, liderazgo y colaboración.
                                </Typography>
                            </Stack>
                        </SlideIn>
                    </Box>

                    {/* ─── Misión & Visión ─── */}
                    <Grid container spacing={3} sx={{ mb: 10 }}>
                        <Grid item xs={12} md={6}>
                            <SlideIn delayMs={60}>
                                <Card sx={{ height: '100%', p: 1, display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Stack spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <AutoGraph color="secondary" />
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                                Misión
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, textAlign: 'justify', flex: 1 }}>
                                                Impulsar el crecimiento de los profesionales de la belleza
                                                mediante una red innovadora de afiliación, capacitación y
                                                desarrollo empresarial, creando oportunidades reales para
                                                quienes desean construir un futuro próspero dentro de la
                                                industria.
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </SlideIn>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <SlideIn delayMs={160}>
                                <Card sx={{ height: '100%', p: 1, display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Stack spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <VisibilityIcon color="secondary" />
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                                Visión
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, textAlign: 'justify', flex: 1 }}>
                                                Ser la red de afiliados de belleza líder en Honduras y
                                                Centroamérica, reconocida por su innovación, liderazgo,
                                                impacto positivo y compromiso con el crecimiento de sus
                                                miembros.
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </SlideIn>
                        </Grid>
                    </Grid>

                    {/* ─── Valores ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Stack spacing={1} sx={{ textAlign: 'center', mb: 4 }}>
                                <Chip
                                    label="Nuestros Valores"
                                    color="secondary"
                                    sx={{ fontWeight: 900, alignSelf: 'center' }}
                                />
                                <Typography variant="h4" sx={{ fontWeight: 950 }}>
                                    Lo que nos define
                                </Typography>
                            </Stack>
                        </SlideIn>
                        <Grid container spacing={2.5}>
                            {valores.map((v, i) => (
                                <Grid key={v.title} item xs={12} sm={6} md={4}>
                                    <SlideIn delayMs={i * 80}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                transition: 'transform 180ms ease, box-shadow 180ms ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow:
                                                        '0 26px 60px rgba(17, 24, 39, 0.12), 0 2px 10px rgba(17, 24, 39, 0.05)',
                                                },
                                            }}
                                        >
                                            <CardContent>
                                                <Stack spacing={1.5} alignItems="flex-start">
                                                    <Box
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 2,
                                                            color: 'secondary.main',
                                                        }}
                                                    >
                                                        {v.icon}
                                                    </Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                                        {v.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'justify' }}>
                                                        {v.text}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </SlideIn>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* ─── Propósito & Propuesta de Valor ─── */}
                    <Grid container spacing={3} sx={{ mb: 10 }}>
                        <Grid item xs={12} md={6}>
                            <SlideIn delayMs={60}>
                                <Card
                                    sx={{
                                        height: '100%',
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                        <Stack spacing={2}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    alignSelf: 'flex-start',
                                                }}
                                            >
                                                <WorkspacePremium color="secondary" />
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                                Propósito
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
                                                Crear una comunidad de profesionales de la belleza donde cada
                                                recomendación, esfuerzo y conexión tenga valor, generando
                                                oportunidades para crecer juntos.
                                            </Typography>
                                            <Divider />
                                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                                Filosofía
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontStyle: 'italic', fontWeight: 600, lineHeight: 1.6 }}
                                            >
                                                "Cuando un salón crece, todos crecemos."
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'justify' }}>
                                                Creemos en una industria más colaborativa, donde las
                                                oportunidades se comparten y el éxito de uno impulsa el
                                                éxito de muchos.
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </SlideIn>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <SlideIn delayMs={160}>
                                <Card
                                    sx={{
                                        height: '100%',
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                        <Stack spacing={2}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    alignSelf: 'flex-start',
                                                }}
                                            >
                                                <Loyalty color="secondary" />
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                                Propuesta de Valor
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
                                                Red Pro Beauty permite a los profesionales de la belleza
                                                acceder a productos profesionales, capacitación especializada
                                                y un sistema de afiliación diseñado para impulsar su
                                                crecimiento. Aquí cada miembro tiene la oportunidad de
                                                construir relaciones, desarrollar liderazgo y participar en
                                                una comunidad enfocada en resultados.
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </SlideIn>
                        </Grid>
                    </Grid>

                    {/* ─── Perfil del Afiliado ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Stack spacing={1} sx={{ textAlign: 'center', mb: 4 }}>
                                <Chip
                                    label="Perfil del Afiliado"
                                    color="secondary"
                                    sx={{ fontWeight: 900, alignSelf: 'center' }}
                                />
                                <Typography variant="h4" sx={{ fontWeight: 950 }}>
                                    ¿Para quién es Red Pro Beauty?
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Afiliados que desean crecer dentro de la industria de la belleza.
                                </Typography>
                            </Stack>
                        </SlideIn>
                        <Grid container spacing={2}>
                            {perfiles.map((p, i) => (
                                <Grid key={p} item xs={12} sm={6} md={4}>
                                    <SlideIn delayMs={i * 60}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                transition: 'transform 180ms ease',
                                                '&:hover': { transform: 'translateY(-2px)' },
                                            }}
                                        >
                                            <CardContent>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <People color="secondary" />
                                                    <Typography sx={{ fontWeight: 800 }}>{p}</Typography>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </SlideIn>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* ─── Líderes Red Pro Beauty ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Card
                                sx={{
                                    height: '100%',
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0.3,
                                        bgcolor: 'rgba(233,30,99,0.12)',
                                    }}
                                />
                                <CardContent sx={{ position: 'relative', p: { xs: 3, md: 5 } }}>
                                    <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                            }}
                                        >
                                            <GroupAdd color="secondary" sx={{ fontSize: 40 }} />
                                        </Box>
                                        <Typography variant="h4" sx={{ fontWeight: 950 }}>
                                            Líderes Red Pro Beauty
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            color="text.secondary"
                                            sx={{ maxWidth: 680, lineHeight: 1.7, textAlign: 'justify' }}
                                        >
                                            Los líderes son el corazón de nuestra comunidad. Son personas
                                            comprometidas con el crecimiento, la formación y el desarrollo de
                                            otros profesionales de la belleza.
                                        </Typography>
                                        <Grid container spacing={2} sx={{ maxWidth: 800 }}>
                                            {[
                                                'Inspira a otros a crecer',
                                                'Comparte conocimiento y experiencia',
                                                'Construye relaciones de confianza',
                                                'Desarrolla equipos sólidos',
                                                'Impulsa nuevas oportunidades dentro de la red',
                                            ].map((c, i) => (
                                                <Grid key={c} item xs={12} sm={6}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Verified color="secondary" sx={{ fontSize: 20 }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {c}
                                                        </Typography>
                                                    </Stack>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            Nuestro liderazgo se basa en el servicio, el ejemplo y la construcción de comunidad.
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </SlideIn>
                    </Box>

                    {/* ─── Mensaje Principal ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Card sx={{ textAlign: 'center', p: { xs: 3, md: 5 } }}>
                                <CardContent>
                                    <Stack spacing={2} alignItems="center">
                                        <Diversity3 color="secondary" sx={{ fontSize: 48 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 950, maxWidth: 700 }}>
                                            No se trata solo de vender productos. Se trata de construir
                                            oportunidades, desarrollar liderazgo y transformar el crecimiento
                                            individual en crecimiento colectivo.
                                        </Typography>
                                        <Divider sx={{ width: 80 }} />
                                        <Typography
                                            variant="body1"
                                            color="text.secondary"
                                            sx={{ fontStyle: 'italic', maxWidth: 600 }}
                                        >
                                            "El poder de tu salón no está solo en lo que haces, sino en las
                                            oportunidades que puedes crear para otros."
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </SlideIn>
                    </Box>

                    {/* ─── Personalidad de Marca ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Stack spacing={1} sx={{ textAlign: 'center', mb: 3 }}>
                                <Chip
                                    label="Personalidad de Marca"
                                    color="secondary"
                                    sx={{ fontWeight: 900, alignSelf: 'center' }}
                                />
                            </Stack>
                        </SlideIn>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
                            {['Profesional', 'Inspiradora', 'Cercana', 'Innovadora', 'Confiable', 'Visionaria', 'Colaborativa'].map((c, i) => (
                                <SlideIn key={c} delayMs={i * 60}>
                                    <Chip
                                        label={c}
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ fontWeight: 700, fontSize: '1rem', py: 2.5, px: 0.5 }}
                                    />
                                </SlideIn>
                            ))}
                        </Stack>
                    </Box>

                    {/* ─── Fundadora ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Card>
                                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                                    <Grid container spacing={4} alignItems="center">
                                        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                            <Avatar
                                                sx={{
                                                    width: 160,
                                                    height: 160,
                                                    mx: 'auto',
                                                    bgcolor: 'primary.main',
                                                    fontSize: 48,
                                                    fontWeight: 950,
                                                }}
                                            >
                                                LS
                                            </Avatar>
                                        </Grid>
                                        <Grid item xs={12} md={8}>
                                            <Stack spacing={1.5}>
                                                <Chip
                                                    label="Fundadora"
                                                    color="secondary"
                                                    sx={{ fontWeight: 900, alignSelf: 'flex-start' }}
                                                />
                                                <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                                    Laura Silvina Izaguirre Sosa
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
                                                    Emprendedora hondureña y fundadora de Red Pro Beauty. Su
                                                    visión nace de la convicción de que los profesionales de
                                                    la belleza merecen más oportunidades para crecer,
                                                    desarrollarse y generar impacto positivo en sus
                                                    comunidades. A través de Red Pro Beauty impulsa un modelo
                                                    basado en liderazgo, capacitación, colaboración y
                                                    crecimiento compartido, creando una nueva forma de
                                                    construir éxito dentro de la industria de la belleza.
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </SlideIn>
                    </Box>

                    {/* ─── Cierre Corporativo ─── */}
                    <Box component="section" sx={{ mt: 10, mb: 6, textAlign: 'center' }}>
                        <SlideIn>
                            <Stack spacing={2} alignItems="center">
                                <Box
                                    component="img"
                                    src="/storage/logo.png"
                                    alt="Logo"
                                    sx={{
                                        height: 120,
                                        width: 'auto',
                                    }}
                                />
                                <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                    Red Pro Beauty
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={3}
                                    divider={<Divider orientation="vertical" flexItem />}
                                    justifyContent="center"
                                    flexWrap="wrap"
                                    useFlexGap
                                    sx={{ color: 'text.secondary' }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Conectamos profesionales.
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Formamos líderes.
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Creamos oportunidades.
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Crecemos juntos.
                                    </Typography>
                                </Stack>
                            </Stack>
                        </SlideIn>
                    </Box>

                    {/* ─── Video Tutorial CTA ─── */}
                    <Box component="section" sx={{ mb: 10 }}>
                        <SlideIn>
                            <Card
                                sx={{
                                    overflow: 'hidden',
                                    position: 'relative',
                                    borderRadius: 3,
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(135deg, #0F4F63 0%, #BFA16B 100%)',
                                        opacity: 0.92,
                                    }}
                                />
                                <CardContent sx={{ position: 'relative', p: { xs: 3, md: 5 }, textAlign: 'center' }}>
                                    <Stack spacing={2.5} alignItems="center">
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(255,255,255,0.15)',
                                                display: 'grid',
                                                placeItems: 'center',
                                            }}
                                        >
                                            <PlayCircle sx={{ fontSize: 56, color: 'common.white' }} />
                                        </Box>
                                        <Typography variant="h4" sx={{ fontWeight: 950, color: 'common.white' }}>
                                            Video Tutoriales
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 560, lineHeight: 1.7 }}
                                        >
                                            Aprende a sacar el maximo provecho de la plataforma con nuestros
                                            videos guia paso a paso. Dashboards, pedidos, puntos y mas.
                                        </Typography>
                                        <Button
                                            component={Link}
                                            href={route('tutorials')}
                                            variant="contained"
                                            size="large"
                                            startIcon={<PlayCircle />}
                                            sx={{
                                                mt: 1,
                                                bgcolor: 'common.white',
                                                color: '#0F4F63',
                                                fontWeight: 800,
                                                px: 4,
                                                py: 1.5,
                                                fontSize: '1rem',
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 14px 40px rgba(0,0,0,0.25)',
                                                    bgcolor: '#f5f5f5',
                                                },
                                            }}
                                        >
                                            Ver Tutoriales
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </SlideIn>
                    </Box>

                </Container>

                <Box
                    component="footer"
                    sx={{
                        flexShrink: 0,
                        bgcolor: 'grey.900',
                        color: 'grey.300',
                        py: 6,
                    }}
                >
                    <Container>
                        <Grid container spacing={4} justifyContent="space-between" sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fff', mb: 1.5 }}>
                                    Red Pro Beauty
                                </Typography>
                                <Typography variant="body2">
                                    La red comercial de salones de belleza mas grande de Honduras.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fff', mb: 1.5 }}>
                                    Enlaces
                                </Typography>
                                <Stack spacing={0.75}>
                                    <Typography variant="body2" component={Link} href={route('shop.catalog')} sx={{ color: 'grey.300', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                        Catalogo
                                    </Typography>
                                    <Typography variant="body2" component={Link} href={route('shop.cart')} sx={{ color: 'grey.300', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                        Carrito
                                    </Typography>
                                    <Typography variant="body2" component={Link} href={route('login')} sx={{ color: 'grey.300', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                        Iniciar sesion
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fff', mb: 1.5 }}>
                                    Contacto
                                </Typography>
                                <Stack spacing={0.75}>
                                    <Typography variant="body2">
                                        info@redprobeauty.hn
                                    </Typography>
                                    <Typography variant="body2">
                                        +504 9999-9999
                                    </Typography>
                                    <Typography variant="body2">
                                        Tegucigalpa, Honduras
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fff', mb: 1.5 }}>
                                    Redes
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <IconButton component="a" href="mailto:info@redprobeauty.hn" sx={{ color: 'grey.300', '&:hover': { color: '#fff' } }}>
                                        <Email />
                                    </IconButton>
                                    <IconButton component="a" href="https://facebook.com" target="_blank" rel="noopener noreferrer" sx={{ color: 'grey.300', '&:hover': { color: '#1877F2' } }}>
                                        <Facebook />
                                    </IconButton>
                                    <IconButton component="a" href="https://instagram.com" target="_blank" rel="noopener noreferrer" sx={{ color: 'grey.300', '&:hover': { color: '#E4405F' } }}>
                                        <Instagram />
                                    </IconButton>
                                    <IconButton component="a" href="https://youtube.com" target="_blank" rel="noopener noreferrer" sx={{ color: 'grey.300', '&:hover': { color: '#FF0000' } }}>
                                        <YouTube />
                                    </IconButton>
                                    <IconButton component="a" href="https://twitter.com" target="_blank" rel="noopener noreferrer" sx={{ color: 'grey.300', '&:hover': { color: '#1DA1F2' } }}>
                                        <Twitter />
                                    </IconButton>
                                </Stack>
                            </Grid>
                        </Grid>
                        <Divider sx={{ borderColor: 'grey.700' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
                            &copy; {new Date().getFullYear()} Red Pro Beauty. Todos los derechos reservados.
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </>
    );
}

function VisibilityIcon({ color }: { color?: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={color || 'currentColor'}>
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
    );
}
