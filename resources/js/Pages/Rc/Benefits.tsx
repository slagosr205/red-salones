import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
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
    fetchBenefits,
    createBenefit as apiCreate,
    deleteBenefit as apiDelete,
    toggleBenefit as apiToggle,
    updateBenefit as apiUpdate,
    type Benefit,
} from '@/rc/benefits';

const emptyForm = () => ({
    title: '',
    kind: '',
    points_cost: 100,
    description: '',
    instructor: '',
    date: '',
    modality: '',
    seats: 30,
    image: null as File | null,
    imagePreview: '',
    active: true,
    target_role: '',
});

const kindOptions = [
    'Descuento',
    'Producto Gratis',
    'Capacitacion',
    'Master Class',
    'Asesoria',
    'Evento',
    'Sorteo',
    'Otro',
];

export default function BenefitsPage() {
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchBenefits();
            setBenefits(data);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    const activeCount = useMemo(() => benefits.filter((b) => b.active).length, [benefits]);
    const [search, setSearch] = useState('');

    function scoreBenefit(query: string, b: Benefit): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const title = b.title?.toLowerCase() ?? '';
        const kind = b.kind?.toLowerCase() ?? '';
        const target = b.targetRole?.toLowerCase() ?? '';
        const active = b.active ? 'activa' : 'inactiva';
        if (title === q || title.startsWith(q)) return 100;
        if (title.includes(q)) return 90;
        if (kind.includes(q)) return 70;
        if (target.includes(q)) return 60;
        if (active.includes(q)) return 50;
        return 0;
    }

    const filteredBenefits = useMemo(() => {
        if (!search.trim()) return benefits;
        return benefits.filter((b) => scoreBenefit(search, b) > 0);
    }, [benefits, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setDialogOpen(true);
    };

    const openEdit = (b: Benefit) => {
        setEditingId(b.id);
        setForm({
            title: b.title,
            kind: b.kind,
            points_cost: b.pointsCost,
            description: b.description ?? '',
            instructor: b.instructor ?? '',
            date: b.date ?? '',
            modality: b.modality ?? '',
            seats: b.seats ?? 30,
            image: null,
            imagePreview: b.imagePath ?? '',
            active: b.active,
            target_role: b.targetRole ?? '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.kind.trim()) return;
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                kind: form.kind,
                points_cost: form.points_cost,
                description: form.description || undefined,
                instructor: form.instructor || undefined,
                date: form.date || undefined,
                modality: form.modality || undefined,
                seats: form.seats || undefined,
                image: form.image || undefined,
                active: form.active,
                target_role: form.target_role || null,
            };
            if (editingId) {
                await apiUpdate(editingId, payload);
            } else {
                await apiCreate(payload as any);
            }
            setDialogOpen(false);
            await load();
        } catch { /* ignore */ }
        setSaving(false);
    };

    const handleToggle = async (id: string) => {
        await apiToggle(id);
        await load();
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Eliminar beneficio "${title}"?`)) return;
        await apiDelete(id);
        await load();
    };

    const columns = useMemo<GridColDef<Benefit>[]>(
        () => [
            { field: 'title', headerName: 'Titulo', flex: 2, minWidth: 200 },
            {
                field: 'kind',
                headerName: 'Tipo',
                flex: 1,
                minWidth: 120,
                renderCell: (params) => (
                    <Chip size="small" variant="outlined" label={params.value} />
                ),
            },
            {
                field: 'pointsCost',
                headerName: 'Costo',
                flex: 0.7,
                minWidth: 80,
                renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {params.value} pts
                    </Typography>
                ),
            },
            {
                field: 'targetRole',
                headerName: 'Dirigido a',
                flex: 0.8,
                minWidth: 120,
                renderCell: (params) => {
                    const labels: Record<string, string> = { lider: 'Lider', salon: 'Salon', consumidor_final: 'Consumidor Final' };
                    const val = params.value as string;
                    return <Chip size="small" label={val ? labels[val] ?? val : 'Todos'} variant="outlined" />;
                },
            },
            {
                field: 'active',
                headerName: 'Estado',
                flex: 0.7,
                minWidth: 90,
                renderCell: (params) =>
                    params.value
                        ? <Chip size="small" color="success" label="Activo" />
                        : <Chip size="small" color="default" label="Inactivo" />,
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
                            onClick={() => handleDelete(params.row.id, params.row.title)}
                        />
                    </Stack>
                ),
            },
        ],
        [],
    );

const isMasterClass = form.kind === 'Master Class' || form.kind === 'Capacitacion';

    return (
        <AuthenticatedLayout header="Beneficios">
            <Head title="Beneficios" />

            <Stack spacing={2.5}>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Totales</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{benefits.length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Activos</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{activeCount}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Inactivos</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{benefits.length - activeCount}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">Costo prom.</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                    {benefits.length > 0
                                        ? Math.round(benefits.reduce((s, b) => s + b.pointsCost, 0) / benefits.length)
                                        : 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Listado de beneficios
                    </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                        Nuevo beneficio
                    </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por titulo, tipo, estado..."
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
                        {filteredBenefits.length} de {benefits.length} beneficios
                    </Typography>
                </Stack>

                <Card>
                    <CardContent>
                        <Box sx={{ height: 480 }}>
                            <DataGrid
                                rows={filteredBenefits}
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
                <DialogTitle>{editingId ? 'Editar beneficio' : 'Nuevo beneficio'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Titulo"
                            size="small"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                        <FormControl size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={form.kind}
                                label="Tipo"
                                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                            >
                                {kindOptions.map((k) => (
                                    <MenuItem key={k} value={k}>{k}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Costo en puntos"
                            type="number"
                            size="small"
                            value={form.points_cost}
                            onChange={(e) => setForm({ ...form, points_cost: Math.max(1, Number(e.target.value)) })}
                            inputProps={{ min: 1 }}
                        />
                        <FormControl size="small">
                            <InputLabel>Dirigido a</InputLabel>
                            <Select
                                value={form.target_role}
                                label="Dirigido a"
                                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="lider">Lider</MenuItem>
                                <MenuItem value="salon">Salon</MenuItem>
                                <MenuItem value="consumidor_final">Consumidor Final</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Descripcion"
                            size="small"
                            multiline
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                        {isMasterClass && (
                            <>
                                <TextField
                                    label="Instructor"
                                    size="small"
                                    value={form.instructor}
                                    onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                                />
                                <TextField
                                    label="Fecha"
                                    type="date"
                                    size="small"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <FormControl size="small">
                                    <InputLabel>Modalidad</InputLabel>
                                    <Select
                                        value={form.modality}
                                        label="Modalidad"
                                        onChange={(e) => setForm({ ...form, modality: e.target.value })}
                                    >
                                        <MenuItem value="Virtual">Virtual</MenuItem>
                                        <MenuItem value="Presencial">Presencial</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Cupo"
                                    type="number"
                                    size="small"
                                    value={form.seats}
                                    onChange={(e) => setForm({ ...form, seats: Math.max(1, Number(e.target.value)) })}
                                    inputProps={{ min: 1 }}
                                />
                            </>
                        )}
                        <Button
                            variant="outlined"
                            component="label"
                            sx={{ textTransform: 'none' }}
                        >
                            {form.image ? form.image.name : 'Subir imagen promocional'}
                            <input
                                type="file"
                                hidden
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setForm({
                                        ...form,
                                        image: file,
                                        imagePreview: file ? URL.createObjectURL(file) : '',
                                    });
                                }}
                            />
                        </Button>
                        {form.imagePreview && (
                            <Box
                                component="img"
                                src={form.imagePreview}
                                sx={{
                                    width: '100%',
                                    maxHeight: 200,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleSave} disabled={!form.title.trim() || !form.kind.trim() || saving}>
                        {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthenticatedLayout>
    );
}
