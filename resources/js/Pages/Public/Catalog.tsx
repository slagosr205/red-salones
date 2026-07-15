import { Head, router, usePage } from '@inertiajs/react';
import {
    Autocomplete,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { addToCart } from '@/rc/cart';
import { products as mockProducts } from '@/rc/mock';
import { refreshActivePromotions, getActivePromotions } from '@/rc/promotions';

function effectivePrice(p: any, role: string | null, clientType?: string | null): number {
    if (!role) {
        return p.public_price ?? p.price ?? 0;
    }
    if (role === 'lider' || role === 'admin') {
        return p.leader_price ?? p.price ?? 0;
    }
    if (clientType === 'consumidor_final') {
        return p.public_price ?? p.price ?? 0;
    }
    return p.price ?? 0;
}

function scoreProduct(query: string, p: any): number {
    const q = query.trim().toLowerCase();
    if (!q) return 1;
    const name = p.name?.toLowerCase() ?? '';
    const brand = p.brand?.toLowerCase() ?? '';
    const category = p.category?.toLowerCase() ?? '';
    if (name === q) return 100;
    if (name.startsWith(q)) return 90;
    if (name.includes(q)) return 80;
    if (brand.includes(q)) return 50;
    if (category.includes(q)) return 40;
    return 0;
}

export default function PublicCatalog() {
    const auth = (usePage().props as any).auth;
    const user = auth?.user ?? null;
    const userRole: string | null = user?.role ?? null;
    const userClientType = user?.client_type;

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [articles, setArticles] = useState<any[]>([]);
    const [promoProductIds, setPromoProductIds] = useState<Set<string>>(new Set());
    const [searchValue, setSearchValue] = useState('');
    const [query, setQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        Promise.all([
            fetch('/api/catalogo-articulos').then((r) => r.json()),
            refreshActivePromotions(),
        ]).then(([prods]) => {
            setArticles(prods);
            setPromoProductIds(new Set(
                getActivePromotions().flatMap((p) => p.productIds),
            ));
        }).catch(() => {});
    }, []);

    const products = useMemo(() => [...articles, ...mockProducts], [articles]);

    const [category, setCategory] = useState<string>('');
    const [brand, setBrand] = useState<string>('');
    const [onlyPromos, setOnlyPromos] = useState(false);
    const [price, setPrice] = useState<number[]>([0, 700]);

    const handleSearchInput = useCallback((_: any, value: string) => {
        setSearchValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setQuery(value), 250);
    }, []);

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 2) return [];
        return products
            .map((p) => ({ p, score: scoreProduct(q, p) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((x) => x.p);
    }, [query, products]);

    const categories = useMemo(
        () => Array.from(new Set(products.map((p) => p.category))).sort(),
        [products],
    );
    const brands = useMemo(
        () => Array.from(new Set(products.map((p) => p.brand))).sort(),
        [products],
    );

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products
            .filter((p) => (q ? scoreProduct(q, p) > 0 : true))
            .filter((p) => (category ? p.category === category : true))
            .filter((p) => (brand ? p.brand === brand : true))
            .filter((p) => (onlyPromos ? promoProductIds.has(p.id) : true))
            .filter((p) => {
                const ep = effectivePrice(p, userRole, userClientType);
                return ep >= price[0] && ep <= price[1];
            });
    }, [query, category, brand, onlyPromos, price, products, userRole, userClientType]);

    const filters = (
        <Box sx={{ p: 2.25, width: 320 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Filtros
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Encuentra productos en segundos.
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
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
                        setSearchValue('');
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
                                Busqueda inteligente — encuentra por nombre, marca o categoria.
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

                    <Autocomplete
                        freeSolo
                        value={searchValue}
                        onInputChange={handleSearchInput}
                        options={suggestions}
                        getOptionLabel={(o: any) => (typeof o === 'string' ? o : o.name)}
                        renderOption={(props, o: any) => {
                            const { key, ...rest } = props;
                            return (
                                <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1 }}>
                                    <Box
                                        sx={{
                                            width: 40, height: 40, borderRadius: 1,
                                            bgcolor: 'grey.100',
                                            background: o.image ? `url(${o.image}) center/cover no-repeat` : undefined,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{o.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>{o.brand} &middot; {o.category}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>L {effectivePrice(o, userRole, userClientType).toFixed(2)}</Typography>
                                </Box>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Buscar por nombre, marca o categoria..."
                                slotProps={{
                                    input: {
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}
                        onChange={(_, v) => {
                            if (v && typeof v === 'object') {
                                setSearchValue((v as any).name);
                                setQuery((v as any).name);
                            }
                        }}
                        clearOnBlur={false}
                    />

                    <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
                        {filters}
                    </Drawer>

                    <Grid container spacing={2.25}>
                        {list.map((p) => (
                            <Grid key={p.id} item xs={12} sm={6} md={4} lg={3}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box
                                        sx={{
                                            aspectRatio: '4/3',
                                            bgcolor: 'grey.100',
                                            background: p.image
                                                ? `url(${p.image}) center/cover no-repeat`
                                                : undefined,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                    <CardContent sx={{ flex: 1 }}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip size="small" label={p.category} />
                                            <Chip size="small" variant="outlined" label={p.brand} />
                                            {promoProductIds.has(p.id) && (
                                                <Chip size="small" color="secondary" label="Promo" />
                                            )}
                                        </Stack>
                                        <Typography sx={{ mt: 1.25, fontWeight: 900 }}>
                                            {p.name}
                                        </Typography>
                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                L {effectivePrice(p, userRole, userClientType).toFixed(2)}
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
