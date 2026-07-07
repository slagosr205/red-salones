import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState } from 'react';

type Leader = { id: number; name: string; email: string };

type Zone = {
    id: number;
    name: string;
    description: string | null;
    leaders: Leader[];
    leaders_count: number;
    created_at: string;
};

type ZoneRow = {
    id: number;
    name: string;
    description: string | null;
    leaders: string;
    leaders_count: number;
};

export default function ZonesPage() {
    const zones = (usePage().props as any).zones as Zone[];
    const allLeaders = (usePage().props as any).leaders as Leader[];

    const [zoneDialog, setZoneDialog] = useState<{
        open: boolean;
        editing: Zone | null;
    }>({ open: false, editing: null });

    const [assignDialog, setAssignDialog] = useState<{
        open: boolean;
        zone: Zone | null;
    }>({ open: false, zone: null });

    const rows: ZoneRow[] = zones.map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        leaders: z.leaders.map((l) => l.name).join(', ') || '-',
        leaders_count: z.leaders_count,
    }));

    const columns: GridColDef<ZoneRow>[] = [
        { field: 'name', headerName: 'Nombre', flex: 2, minWidth: 180 },
        {
            field: 'description',
            headerName: 'Descripcion',
            flex: 2,
            minWidth: 200,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                    {params.value || '—'}
                </Typography>
            ),
        },
        { field: 'leaders', headerName: 'Lideres asignados', flex: 2, minWidth: 220 },
        {
            field: 'leaders_count',
            headerName: 'Cant.',
            flex: 0.5,
            minWidth: 80,
            renderCell: (params) => <Chip size="small" label={params.value} color="primary" variant="outlined" />,
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            flex: 1,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                            setAssignDialog({
                                open: true,
                                zone: zones.find((z) => z.id === params.row.id) ?? null,
                            })
                        }
                    >
                        Asignar lideres
                    </Button>
                    <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                            setZoneDialog({
                                open: true,
                                editing: zones.find((z) => z.id === params.row.id) ?? null,
                            })
                        }
                    >
                        <Edit fontSize="small" />
                    </Button>
                    <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={() => {
                            if (confirm(`Eliminar la zona "${params.row.name}"?`)) {
                                router.delete(route('rc.zones.destroy', params.row.id));
                            }
                        }}
                    >
                        <Delete fontSize="small" />
                    </Button>
                </Stack>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header="Zonas Comerciales">
            <Head title="Zonas Comerciales" />

            <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.25}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            Zonas Comerciales
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {zones.length} zonas registradas
                        </Typography>
                    </Stack>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setZoneDialog({ open: true, editing: null })}
                    >
                        + Nueva zona
                    </Button>
                </Stack>

                <Card>
                    <CardContent>
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
            </Stack>

            <ZoneFormDialog
                open={zoneDialog.open}
                zone={zoneDialog.editing}
                onClose={() => setZoneDialog({ open: false, editing: null })}
            />

            <AssignLeadersDialog
                open={assignDialog.open}
                zone={assignDialog.zone}
                leaders={allLeaders}
                onClose={() => setAssignDialog({ open: false, zone: null })}
            />
        </AuthenticatedLayout>
    );
}

function ZoneFormDialog({
    open,
    zone,
    onClose,
}: {
    open: boolean;
    zone: Zone | null;
    onClose: () => void;
}) {
    const [name, setName] = useState(zone?.name ?? '');
    const [description, setDescription] = useState(zone?.description ?? '');
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const isEditing = !!zone;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = { name, description };

        if (isEditing) {
            router.post(route('rc.zones.update', zone.id), payload as any, {
                onFinish: () => setSaving(false),
                onSuccess: () => onClose(),
            });
        } else {
            router.post(route('rc.zones.store'), payload as any, {
                onFinish: () => setSaving(false),
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 1300,
                bgcolor: 'rgba(0,0,0,0.5)',
            }}
            onClick={onClose}
        >
            <Card sx={{ width: 420, p: 2 }} onClick={(e) => e.stopPropagation()}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        {isEditing ? 'Editar zona' : 'Nueva zona'}
                    </Typography>

                    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                        <TextField
                            required
                            size="small"
                            label="Nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <TextField
                            size="small"
                            label="Descripcion"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                        />
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear zona'}
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}

function AssignLeadersDialog({
    open,
    zone,
    leaders,
    onClose,
}: {
    open: boolean;
    zone: Zone | null;
    leaders: Leader[];
    onClose: () => void;
}) {
    const [selected, setSelected] = useState<Leader[]>(() => zone?.leaders ?? []);
    const [saving, setSaving] = useState(false);

    if (!open || !zone) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 1300,
                bgcolor: 'rgba(0,0,0,0.5)',
            }}
            onClick={onClose}
        >
            <Card sx={{ width: 420, p: 2 }} onClick={(e) => e.stopPropagation()}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Asignar lideres
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Zona: {zone.name}
                    </Typography>

                    <Autocomplete
                        multiple
                        value={selected}
                        onChange={(_, v) => setSelected(v)}
                        options={leaders}
                        getOptionLabel={(o) => `${o.name} (${o.email})`}
                        renderInput={(params) => (
                            <TextField {...params} label="Lideres" size="small" placeholder="Seleccionar lideres..." />
                        )}
                        fullWidth
                    />

                    <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            disabled={saving}
                            onClick={() => {
                                setSaving(true);
                                router.post(
                                    route('rc.zones.assign-leaders', zone.id),
                                    { leader_ids: selected.map((l) => l.id) },
                                    {
                                        onFinish: () => setSaving(false),
                                        onSuccess: () => onClose(),
                                    },
                                );
                            }}
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
