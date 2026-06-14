import { Head, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Container,
    Drawer,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Slider,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { FilterList, Search, ShoppingCart } from '@mui/icons-material';
import { useMemo, useState } from 'react';

import { addToCart } from '@/rc/cart';
import { products } from '@/rc/mock';

export default function PublicCatalog() {
    const auth = (usePage().props as any).auth;
    const user = auth?.user ?? null;

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string>('');
    const [brand, setBrand] = useState<string>('');
    const [onlyPromos, setOnlyPromos] = useState(false);
    const [price, setPrice] = useState<number[]>([0, 700]);

    const categories = useMemo(
        () => Array.from(new Set(products.map((p) => p.category))).sort(),
        [],
    );
    const brands = useMemo(
        () => Array.from(new Set(products.map((p) => p.brand))).sort(),
        [],
    );

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products
            .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
            .filter((p) => (category ? p.category === category : true))
            .filter((p) => (brand ? p.brand === brand : true))
            .filter((p) => (onlyPromos ? !!p.promo : true))
            .filter((p) => p.price >= price[0] && p.price <= price[1]);
    }, [query, category, brand, onlyPromos, price]);

    const filters = (
        <Box sx={{ p: 2.25, width: 320 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Filtros
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Encuentra productos en segundos.
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                    label="Buscar"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />

                <FormControl size="small">
                    <Typography variant="caption" color="text.secondary">
                        Categoria
                    </Typography>
                    <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        displayEmpty
                    >
                        <MenuItem value="">Todas</MenuItem>
                        {categories.map((c) => (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small">
                    <Typography variant="caption" color="text.secondary">
                        Marca
                    </Typography>
                    <Select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        displayEmpty
                    >
                        <MenuItem value="">Todas</MenuItem>
                        {brands.map((b) => (
                            <MenuItem key={b} value={b}>
                                {b}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Precio (L)
                    </Typography>
                    <Slider
                        value={price}
                        onChange={(_, v) => setPrice(v as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={700}
                        step={10}
                    />
                </Box>

                <FormControlLabel
                    control={
                        <Switch
                            checked={onlyPromos}
                            onChange={(e) => setOnlyPromos(e.target.checked)}
                        />
                    }
                    label="Solo promociones"
                />

                <Button
                    variant="outlined"
                    onClick={() => {
                        setQuery('');
                        setCategory('');
                        setBrand('');
                        setOnlyPromos(false);
                        setPrice([0, 700]);
                    }}
                >
                    Limpiar
                </Button>
            </Stack>
        </Box>
    );

    return (
        <>
            <Head title="Catalogo" />

            <Box
                sx={{
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    py: { xs: 3, md: 5 },
                }}
            >
                <Container>
                    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'flex-end' }} justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                            <Typography variant="h4">Catalogo</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Puedes seleccionar productos sin iniciar sesion.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <IconButton aria-label="filtros" onClick={() => setFiltersOpen(true)}>
                                <FilterList />
                            </IconButton>
                            <Button
                                startIcon={<ShoppingCart />}
                                variant="contained"
                                onClick={() => router.visit(route('shop.cart'))}
                            >
                                Ver carrito
                            </Button>
                            {user ? (
                                <Button variant="outlined" onClick={() => router.visit(route('dashboard'))}>
                                    Ir al dashboard
                                </Button>
                            ) : (
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        router.visit(`${route('login')}?redirect=${encodeURIComponent(route('shop.cart'))}`)
                                    }
                                >
                                    Iniciar sesion
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
                        {filters}
                    </Drawer>

                    <Grid container spacing={2.25}>
                        {list.map((p) => (
                            <Grid key={p.id} item xs={12} sm={6} md={4} lg={3}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box
                                        sx={{
                                            height: 140,
                                            bgcolor: 'grey.100',
                                            background:
                                                'linear-gradient(135deg, rgba(233,30,99,0.15), rgba(156,39,176,0.08))',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                    <CardContent sx={{ flex: 1 }}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip size="small" label={p.category} />
                                            <Chip size="small" variant="outlined" label={p.brand} />
                                            {p.promo && (
                                                <Chip size="small" color="secondary" label={`Promo: ${p.promo}`} />
                                            )}
                                        </Stack>
                                        <Typography sx={{ mt: 1.25, fontWeight: 900 }}>
                                            {p.name}
                                        </Typography>
                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                L {p.price.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {p.points} puntos
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                    <CardActions sx={{ px: 2, pb: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={() => {
                                                addToCart(p);
                                                router.visit(route('shop.cart'));
                                            }}
                                        >
                                            Agregar al carrito
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {list.length === 0 && (
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 800 }}>Sin resultados</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ajusta filtros o prueba otra busqueda.
                            </Typography>
                        </Box>
                    )}
                </Container>
            </Box>
        </>
    );
}
