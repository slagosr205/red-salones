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
    InputAdornment,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Add, CheckCircle, Delete, Edit, PanTool, Search } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    fetchPromotions,
    createPromotion as apiCreate,
    deletePromotion as apiDelete,
    togglePromotion as apiToggle,
    updatePromotion as apiUpdate,
    refreshActivePromotions,
    type Promotion,
    type PromoType,
} from '@/rc/promotions';

const typeLabels: Record<PromoType, string> = {
    '2x1': '2x1',
    descuento: 'Descuento %',
    combo: 'Combo %',
};

const typeColors: Record<PromoType, 'primary' | 'secondary' | 'info'> = {
    '2x1': 'primary',
    descuento: 'secondary',
    combo: 'info',
};

interface CatalogArticle {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
}

const emptyForm = () => ({
    name: '',
    type: 'descuento' as PromoType,
    value: 15,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true,
    article_ids: [] as number[],
});

function artIdToNumeric(artId: string): number {
    return Number(artId.replace('art-', ''));
}

export default function PromotionsPage() {
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [articles, setArticles] = useState<CatalogArticle[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [p, a] = await Promise.all([
                fetchPromotions(),
                fetch('/api/catalogo-articulos').then((r) => r.json()),
            ]);
            setPromos(p);
            setArticles(a);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    const activeCount = useMemo(() => promos.filter((p) => p.active).length, [promos]);
    const [search, setSearch] = useState('');

    function scorePromo(query: string, p: Promotion): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const name = p.name?.toLowerCase() ?? '';
        const type = p.type?.toLowerCase() ?? '';
        const active = p.active ? 'activa' : 'inactiva';
        const typeLabel = typeLabels[p.type]?.toLowerCase() ?? '';
        if (name === q || name.startsWith(q)) return 100;
        if (name.includes(q)) return 90;
        if (typeLabel.includes(q) || type.includes(q)) return 70;
        if (active.includes(q)) return 60;
        return 0;
    }

    const filteredPromos = useMemo(() => {
        if (!search.trim()) return promos;
        return promos.filter((p) => scorePromo(search, p) > 0);
    }, [promos, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setDialogOpen(true);
    };

    const openEdit = (p: Promotion) => {
        setEditingId(p.id);
        setForm({
            name: p.name,
            type: p.type,
            value: p.value,
            startDate: p.startDate,
            endDate: p.endDate,
            active: p.active,
            article_ids: p.productIds.map(artIdToNumeric),
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await apiUpdate(editingId, form);
            } else {
                await apiCreate(form);
            }
            setDialogOpen(false);
            await load();
            await refreshActivePromotions();
        } catch { /* ignore */ }
        setSaving(false);
    };

    const handleToggle = async (id: string) => {
        await apiToggle(id);
        await load();
        await refreshActivePromotions();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Eliminar promocion "${name}"?`)) return;
        await apiDelete(id);
        await load();
        await refreshActivePromotions();
    };

    const productOptions = useMemo(
        () => articles.filter((a) => !isNaN(artIdToNumeric(a.id))),
        [articles],
    );

    const selectedProducts = useMemo(
        () => productOptions.filter((a) => form.article_ids.includes(artIdToNumeric(a.id))),
        [productOptions, form.article_ids],
    );

    const columns = useMemo<GridColDef<Promotion>[]>(
        () => [
            { field: 'name', headerName: 'Nombre', flex: 2, minWidth: 200 },
            {
                field: 'type',
                headerName: 'Tipo',
                flex: 1,
                minWidth: 120,
                renderCell: (params) => (
                    <Chip size="small" color={typeColors[params.value as PromoType]} label={typeLabels[params.value as PromoType]} />
                ),
            },
            {
                field: 'value',
                headerName: 'Valor',
                flex: 0.5,
                minWidth: 80,
                renderCell: (params) => {
                    const row = params.row as Promotion;
                    if (row.type === '2x1') return <Typography variant="body2">-</Typography>;
                    return <Typography variant="body2">{row.value}%</Typography>;
                },
            },
            {
                field: 'startDate',
                headerName: 'Inicio',
                flex: 1,
                minWidth: 100,
            },
            {
                field: 'endDate',
                headerName: 'Fin',
                flex: 1,
                minWidth: 100,
            },
            {
                field: 'active',
                headerName: 'Estado',
                flex: 0.8,
                minWidth: 100,
                renderCell: (params) => {
                    const expired = new Date(params.row.endDate) < new Date();
                    if (expired) return <Chip size="small" color="default" label="Vencida" />;
                    return params.value
                        ? <Chip size="small" color="success" label="Activa" />
                        : <Chip size="small" color="default" label="Inactiva" />;
                },
            },
            {
                field: 'actions',
                headerName: '',
                flex: 1.2,
                minWidth: 180,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction="row" spacing={0.5}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={params.row.active ? <PanTool /> : <CheckCircle />}
                            onClick={() => handleToggle(params.row.id)}
                        >
                            {params.row.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<Edit />}
                            onClick={() => openEdit(params.row)}
                        />
                        <Button
                            size="small"
                            variant="text"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDelete(params.row.id, params.row.name)}
                        />
                    </Stack>
                ),
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout header="Promociones">
            <Head title="Promociones" />

            <Stack spacing={2.5}>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Totales</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{promos.length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Activas</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{activeCount}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Inactivas</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{promos.length - activeCount}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">2x1 activos</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                    {promos.filter((p) => p.type === '2x1' && p.active).length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Listado de promociones
                    </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                        Nueva promocion
                    </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por nombre, tipo, estado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                            },
                        }}
                        sx={{ minWidth: 300 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {filteredPromos.length} de {promos.length} promociones
                    </Typography>
                </Stack>

                <Card>
                    <CardContent>
                        <Box sx={{ height: 480 }}>
                            <DataGrid
                                rows={filteredPromos}
                                columns={columns}
                                getRowId={(r) => r.id}
                                loading={loading}
                                disableRowSelectionOnClick
                                pageSizeOptions={[5, 10, 25]}
                                initialState={{
                                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Stack>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Editar promocion' : 'Nueva promocion'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Nombre"
                            size="small"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <FormControl size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={form.type}
                                label="Tipo"
                                onChange={(e) => {
                                    const t = e.target.value as PromoType;
                                    const defaultValues: Record<PromoType, number> = { '2x1': 0, descuento: 15, combo: 10 };
                                    setForm({ ...form, type: t, value: defaultValues[t] });
                                }}
                            >
                                <MenuItem value="descuento">Descuento %</MenuItem>
                                <MenuItem value="2x1">2x1</MenuItem>
                                <MenuItem value="combo">Combo %</MenuItem>
                            </Select>
                        </FormControl>
                        {form.type !== '2x1' && (
                            <TextField
                                label="Porcentaje de descuento"
                                type="number"
                                size="small"
                                value={form.value}
                                onChange={(e) => setForm({ ...form, value: Math.max(0, Math.min(100, Number(e.target.value))) })}
                                inputProps={{ min: 0, max: 100 }}
                            />
                        )}
                        <TextField
                            label="Fecha inicio"
                            type="date"
                            size="small"
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Fecha fin"
                            type="date"
                            size="small"
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Autocomplete
                            multiple
                            value={selectedProducts}
                            onChange={(_, v) => setForm({ ...form, article_ids: v.map((a) => artIdToNumeric(a.id)) })}
                            options={productOptions}
                            getOptionLabel={(o) => `${o.name} (${o.category})`}
                            renderInput={(params) => (
                                <TextField {...params} label="Productos (dejar vacio = todos)" size="small" />
                            )}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || saving}>
                        {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthenticatedLayout>
    );
}
