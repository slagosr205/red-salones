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
import { Add, CheckCircle, Delete, Edit, PanTool } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';

import {
    createPromotion,
    deletePromotion,
    getPromotions,
    togglePromotion,
    updatePromotion,
    type Promotion,
    type PromoType,
} from '@/rc/promotions';
import { products } from '@/rc/mock';

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

const emptyForm = (): Omit<Promotion, 'id' | 'createdAt'> => ({
    name: '',
    type: 'descuento',
    value: 15,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true,
    productIds: [],
});

export default function PromotionsPage() {
    const [promos, setPromos] = useState<Promotion[]>(() => getPromotions());

    useEffect(() => {
        const onChange = () => setPromos(getPromotions());
        window.addEventListener('rc_promotions_changed', onChange);
        return () => window.removeEventListener('rc_promotions_changed', onChange);
    }, []);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm());

    const activeCount = useMemo(() => promos.filter((p) => p.active).length, [promos]);

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
            productIds: p.productIds,
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) return;
        if (editingId) {
            updatePromotion(editingId, form);
        } else {
            createPromotion(form);
        }
        setDialogOpen(false);
    };

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
                            onClick={() => togglePromotion(params.row.id)}
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
                            onClick={() => {
                                if (confirm(`Eliminar promocion "${params.row.name}"?`)) {
                                    deletePromotion(params.row.id);
                                }
                            }}
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

                <Card>
                    <CardContent>
                        <Box sx={{ height: 480 }}>
                            <DataGrid
                                rows={promos}
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
            </Stack>

            {/* Create / Edit dialog */}
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
                            value={products.filter((p) => form.productIds.includes(p.id))}
                            onChange={(_, v) => setForm({ ...form, productIds: v.map((p) => p.id) })}
                            options={products}
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
                    <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
                        {editingId ? 'Guardar cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthenticatedLayout>
    );
}
