import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
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
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add,
    Inventory2,
    TrendingDown,
    TrendingUp,
    Warning,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';

import {
    addEntry,
    getCategories,
    getCriticalItems,
    getInventory,
    getMovements,
    getOutOfStockItems,
    getRecentMovements,
    initializeInventory,
    setMinStock,
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

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>(() => {
        initializeInventory();
        return getInventory();
    });
    const [movements, setMovements] = useState<StockMovement[]>(() => getRecentMovements(20));

    useEffect(() => {
        const onChange = () => {
            setItems(getInventory());
            setMovements(getRecentMovements(20));
        };
        window.addEventListener('rc_inventory_changed', onChange);
        return () => window.removeEventListener('rc_inventory_changed', onChange);
    }, []);

    const [categoryFilter, setCategoryFilter] = useState('');
    const [entryOpen, setEntryOpen] = useState(false);
    const [minOpen, setMinOpen] = useState<string | null>(null);
    const [minValue, setMinValue] = useState(10);

    const categories = useMemo(() => getCategories(), [items]);
    const critical = useMemo(() => getCriticalItems(), [items]);
    const outOfStock = useMemo(() => getOutOfStockItems(), [items]);
    const totalValue = useMemo(
        () => items.reduce((acc, i) => acc + i.stock * i.price, 0),
        [items],
    );

    const rows: StockRow[] = useMemo(() => {
        return items
            .filter((i) => (categoryFilter ? i.category === categoryFilter : true))
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
    }, [items, categoryFilter]);

    const columns = useMemo<GridColDef<StockRow>[]>(
        () => [
            { field: 'product', headerName: 'Producto', flex: 2, minWidth: 200 },
            {
                field: 'category',
                headerName: 'Categoria',
                flex: 1,
                minWidth: 120,
                renderCell: (params) => <Chip size="small" label={params.value} />,
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
                    <Stack direction="row" alignItems="center" spacing={0.5}>
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
                    </Stack>
                ),
            },
            {
                field: 'status',
                headerName: 'Estado',
                flex: 1,
                minWidth: 100,
                renderCell: (params) => (
                    <Chip size="small" color={chipColor[params.value as StockRow['status']]} label={params.value} />
                ),
            },
            {
                field: 'actions',
                headerName: '',
                flex: 1,
                minWidth: 140,
                sortable: false,
                renderCell: (params) => (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => {
                            setEntryProduct(params.row.productId);
                            setEntryOpen(true);
                        }}
                    >
                        Entrada
                    </Button>
                ),
            },
        ],
        [],
    );

    const [entryProduct, setEntryProduct] = useState<string>('');
    const [entryQty, setEntryQty] = useState(1);
    const [entryNote, setEntryNote] = useState('');

    const handleEntry = () => {
        if (entryQty < 1) return;
        addEntry(entryProduct, entryQty, entryNote || undefined);
        setEntryOpen(false);
        setEntryQty(1);
        setEntryNote('');
    };

    const handleSetMin = () => {
        if (minOpen) {
            setMinStock(minOpen, minValue);
            setMinOpen(null);
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
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                Stock por producto
                            </Typography>
                            <Stack direction="row" spacing={1.5} alignItems="center">
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
                                    sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}
                                >
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {m.productName}
                                        </Typography>
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
        </AuthenticatedLayout>
    );
}
