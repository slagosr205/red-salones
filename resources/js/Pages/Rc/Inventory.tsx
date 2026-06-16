import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add,
    Info,
    Inventory2,
    Search,
    TrendingDown,
    TrendingUp,
    Warning,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';

import {
    addEntry as clientAddEntry,
    getInventory,
    setInventory,
    type InventoryItem,
    type StockMovement,
} from '@/rc/inventory';

type StockRow = {
    id: string;
    productId: string;
    product: string;
    category: string;
    brand: string;
    stock: number;
    min: number;
    price: number;
    status: 'Verde' | 'Amarillo' | 'Rojo';
};

function computeStatus(stock: number, min: number): StockRow['status'] {
    if (stock === 0) return 'Rojo';
    if (stock <= min) return 'Amarillo';
    return 'Verde';
}

const chipColor: Record<StockRow['status'], 'success' | 'warning' | 'error'> = {
    Verde: 'success',
    Amarillo: 'warning',
    Rojo: 'error',
};

function articleToInventory(a: any): InventoryItem {
    return {
        productId: a.id,
        name: a.name,
        category: a.category,
        brand: a.brand,
        stock: a.stock ?? 0,
        minStock: a.minStock ?? 0,
        price: a.price ?? 0,
    };
}

export default function InventoryPage({ items: initialItems }: { items?: any[] }) {
    const [items, setItems] = useState<InventoryItem[]>(() => {
        if (initialItems && initialItems.length > 0) {
            const inv = initialItems.map(articleToInventory);
            setInventory(inv);
            return inv;
        }
        return [];
    });
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/inventario').then((r) => r.json()),
            fetch('/api/inventario/movimientos').then((r) => r.json()),
        ])
            .then(([data, movs]) => {
                const inv = (data as any[]).map(articleToInventory);
                setInventory(inv);
                setItems(inv);
                setMovements(movs as StockMovement[]);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    async function refreshInventory() {
        try {
            const [itemsRes, movsRes] = await Promise.all([
                axios.get('/api/inventario'),
                axios.get('/api/inventario/movimientos'),
            ]);
            const inv = (itemsRes.data as any[]).map(articleToInventory);
            setInventory(inv);
            setItems(inv);
            setMovements(movsRes.data as StockMovement[]);
        } catch { }
    }

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    function scoreInventory(query: string, i: InventoryItem): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const name = i.name?.toLowerCase() ?? '';
        const brand = i.brand?.toLowerCase() ?? '';
        const category = i.category?.toLowerCase() ?? '';
        if (name === q || name.startsWith(q)) return 100;
        if (name.includes(q)) return 90;
        if (brand.includes(q)) return 70;
        if (category.includes(q)) return 60;
        return 0;
    }
    const [movementDetail, setMovementDetail] = useState<StockMovement | null>(null);
    const [articleMovements, setArticleMovements] = useState<{ productId: string; productName: string } | null>(null);
    const [entryOpen, setEntryOpen] = useState(false);
    const [minOpen, setMinOpen] = useState<string | null>(null);
    const [minValue, setMinValue] = useState(10);

    const categories = useMemo(
        () => Array.from(new Set(items.map((i) => i.category))).sort(),
        [items],
    );
    const critical = useMemo(() => items.filter((i) => i.stock > 0 && i.stock <= i.minStock), [items]);
    const outOfStock = useMemo(() => items.filter((i) => i.stock === 0), [items]);
    const totalValue = useMemo(
        () => items.reduce((acc, i) => acc + i.stock * i.price, 0),
        [items],
    );

    const rows: StockRow[] = useMemo(() => {
        return items
            .filter((i) => (categoryFilter ? i.category === categoryFilter : true))
            .filter((i) => (search ? scoreInventory(search, i) > 0 : true))
            .map((i) => ({
                id: i.productId,
                productId: i.productId,
                product: i.name,
                category: i.category,
                brand: i.brand,
                stock: i.stock,
                min: i.minStock,
                price: i.price,
                status: computeStatus(i.stock, i.minStock),
            }));
    }, [items, categoryFilter, search]);

    const columns = useMemo<GridColDef<StockRow>[]>(
        () => [
            { field: 'product', headerName: 'Producto', flex: 2, minWidth: 200 },
            {
                field: 'category',
                headerName: 'Categoria',
                flex: 1,
                minWidth: 120,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Chip size="small" label={params.value} />
                    </Box>
                ),
            },
            { field: 'brand', headerName: 'Marca', flex: 1, minWidth: 120 },
            {
                field: 'stock',
                headerName: 'Stock',
                flex: 1,
                minWidth: 80,
                align: 'right',
                headerAlign: 'right',
            },
            {
                field: 'min',
                headerName: 'Minimo',
                flex: 1,
                minWidth: 80,
                align: 'right',
                headerAlign: 'right',
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
                        <Typography variant="body2">{params.value}</Typography>
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                setMinValue(params.row.min);
                                setMinOpen(params.row.id);
                            }}
                        >
                            Editar
                        </Button>
                    </Box>
                ),
            },
            {
                field: 'status',
                headerName: 'Estado',
                flex: 1,
                minWidth: 100,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Chip size="small" color={chipColor[params.value as StockRow['status']]} label={params.value} />
                    </Box>
                ),
            },
            {
                field: 'actions',
                headerName: '',
                flex: 1.2,
                minWidth: 200,
                sortable: false,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                setEntryProduct(params.row.productId);
                                setEntryOpen(true);
                            }}
                        >
                            Entrada
                        </Button>
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<Info />}
                            onClick={() => {
                                setArticleMovements({ productId: params.row.productId, productName: params.row.product });
                            }}
                        >
                            Movimientos
                        </Button>
                    </Box>
                ),
            },
        ],
        [],
    );

    const [entryProduct, setEntryProduct] = useState<string>('');
    const [entryQty, setEntryQty] = useState(1);
    const [entryNote, setEntryNote] = useState('');

    const handleEntry = async () => {
        if (entryQty < 1) return;
        try {
            await axios.post('/api/inventario/entrada', {
                product_id: entryProduct,
                qty: entryQty,
                note: entryNote || undefined,
            });
            clientAddEntry(entryProduct, entryQty, entryNote || undefined);
            await refreshInventory();
        } catch { }
        setEntryOpen(false);
        setEntryQty(1);
        setEntryNote('');
    };

    const handleSetMin = async () => {
        if (minOpen) {
            try {
                await axios.post('/api/inventario/min-stock', {
                    product_id: minOpen,
                    min_stock: minValue,
                });
            } catch { }
            setMinOpen(null);
            await refreshInventory();
        }
    };

    const entryProductName = items.find((i) => i.productId === entryProduct)?.name ?? '';

    return (
        <AuthenticatedLayout header="Inventario">
            <Head title="Inventario" />

            <Stack spacing={2.5}>
                {/* Dashboard */}
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Stock critico
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            {critical.length}
                                        </Typography>
                                    </Box>
                                    <Warning color="warning" />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Agotados
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            {outOfStock.length}
                                        </Typography>
                                    </Box>
                                    <TrendingDown color="error" />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Movimientos
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            {movements.length}
                                        </Typography>
                                    </Box>
                                    <TrendingUp color="primary" />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Valor inventario
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            L {totalValue.toFixed(0)}
                                        </Typography>
                                    </Box>
                                    <Inventory2 color="secondary" />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Stock table */}
                <Card>
                    <CardContent>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2 }} spacing={1.5}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                    Stock por producto
                                </Typography>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <TextField
                                        size="small"
                                        placeholder="Buscar producto, marca..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                                            },
                                        }}
                                        sx={{ minWidth: 220 }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 160 }}>
                                        <InputLabel>Categoria</InputLabel>
                                        <Select
                                            value={categoryFilter}
                                            label="Categoria"
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <MenuItem value="">Todas</MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c} value={c}>
                                                    {c}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Stack>
                        <Box sx={{ height: 480 }}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                getRowId={(r) => r.id}
                                disableRowSelectionOnClick
                                pageSizeOptions={[5, 10, 25]}
                                initialState={{
                                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Recent movements */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>
                            Movimientos recientes
                        </Typography>
                        {movements.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No hay movimientos registrados.
                            </Typography>
                        )}
                        <Stack spacing={1}>
                            {movements.slice(0, 15).map((m) => (
                                <Stack
                                    key={m.id}
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    onClick={() => setMovementDetail(m)}
                                    sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}
                                >
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {m.productName}
                                            </Typography>
                                            <Info sx={{ fontSize: 14, color: 'text.disabled' }} />
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(m.date).toLocaleString()} {m.note ? `- ${m.note}` : ''}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size="small"
                                        color={m.type === 'entry' ? 'success' : m.type === 'sale' ? 'error' : 'warning'}
                                        label={
                                            m.qty > 0
                                                ? `+${m.qty}`
                                                : `${m.qty}`
                                        }
                                    />
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>

            {/* Entry dialog */}
            <Dialog open={entryOpen} onClose={() => setEntryOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Registrar entrada</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Autocomplete
                            value={items.find((i) => i.productId === entryProduct) ?? null}
                            onChange={(_, v) => setEntryProduct(v?.productId ?? '')}
                            options={items}
                            getOptionLabel={(o) => `${o.name} (stock: ${o.stock})`}
                            renderInput={(params) => <TextField {...params} label="Producto" size="small" />}
                            fullWidth
                        />
                        <TextField
                            label="Cantidad"
                            type="number"
                            size="small"
                            value={entryQty}
                            onChange={(e) => setEntryQty(Math.max(1, Number(e.target.value)))}
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="Nota (opcional)"
                            size="small"
                            value={entryNote}
                            onChange={(e) => setEntryNote(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setEntryOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleEntry} disabled={!entryProduct || entryQty < 1}>
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Min stock dialog */}
            <Dialog open={!!minOpen} onClose={() => setMinOpen(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Editar stock minimo</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Stock minimo"
                        type="number"
                        size="small"
                        value={minValue}
                        onChange={(e) => setMinValue(Math.max(0, Number(e.target.value)))}
                        inputProps={{ min: 0 }}
                        fullWidth
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setMinOpen(null)}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleSetMin}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Article movements dialog */}
            <Dialog open={!!articleMovements} onClose={() => setArticleMovements(null)} maxWidth="sm" fullWidth>
                {articleMovements && (() => {
                    const filtered = movements.filter((m) => m.productId === articleMovements.productId);
                    return (
                        <>
                            <DialogTitle>Movimientos de {articleMovements.productName}</DialogTitle>
                            <DialogContent>
                                {filtered.length === 0 ? (
                                    <Typography color="text.secondary">Sin movimientos registrados.</Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {filtered.map((m) => (
                                            <Stack
                                                key={m.id}
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                onClick={() => { setArticleMovements(null); setMovementDetail(m); }}
                                                sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}
                                            >
                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Chip
                                                            size="small"
                                                            color={m.type === 'entry' ? 'success' : m.type === 'sale' ? 'error' : 'warning'}
                                                            label={
                                                                m.type === 'entry' ? 'Entrada' :
                                                                m.type === 'sale' ? 'Venta' : 'Ajuste'
                                                            }
                                                            sx={{ height: 20, fontSize: 10 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Stock: {m.stockBefore} → {m.stockAfter}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="caption" color="text.disabled">
                                                        {new Date(m.date).toLocaleString()} {m.note ? `- ${m.note}` : ''}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontWeight: 700, color: m.qty > 0 ? 'success.main' : 'error.main' }}>
                                                    {m.qty > 0 ? `+${m.qty}` : m.qty}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                )}
                            </DialogContent>
                            <DialogActions sx={{ px: 2, pb: 2 }}>
                                <Button variant="contained" onClick={() => setArticleMovements(null)}>
                                    Cerrar
                                </Button>
                            </DialogActions>
                        </>
                    );
                })()}
            </Dialog>

            {/* Movement detail dialog */}
            <Dialog open={!!movementDetail} onClose={() => setMovementDetail(null)} maxWidth="xs" fullWidth>
                {movementDetail && (
                    <>
                        <DialogTitle>Detalle del movimiento</DialogTitle>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Producto</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{movementDetail.productName}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Tipo</Typography>
                                    <Chip
                                        size="small"
                                        color={movementDetail.type === 'entry' ? 'success' : movementDetail.type === 'sale' ? 'error' : 'warning'}
                                        label={
                                            movementDetail.type === 'entry' ? 'Entrada' :
                                            movementDetail.type === 'sale' ? 'Venta' : 'Ajuste'
                                        }
                                    />
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Cantidad</Typography>
                                    <Typography sx={{ fontWeight: 700, color: movementDetail.qty > 0 ? 'success.main' : 'error.main' }}>
                                        {movementDetail.qty > 0 ? `+${movementDetail.qty}` : movementDetail.qty}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Stock anterior</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{movementDetail.stockBefore}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Stock posterior</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{movementDetail.stockAfter}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Fecha</Typography>
                                    <Typography>{new Date(movementDetail.date).toLocaleString()}</Typography>
                                </Stack>
                                {movementDetail.note && (
                                    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
                                        <Typography variant="caption" color="text.secondary">Nota</Typography>
                                        <Typography variant="body2">{movementDetail.note}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ px: 2, pb: 2 }}>
                            <Button variant="contained" onClick={() => setMovementDetail(null)}>
                                Cerrar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </AuthenticatedLayout>
    );
}
