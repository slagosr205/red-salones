import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Grid,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

type MasterClass = {
    id: number;
    title: string;
    kind: string;
    points_cost: number;
    description: string | null;
    instructor: string | null;
    date: string | null;
    modality: string | null;
    seats: number | null;
    image_path: string | null;
    active: boolean;
};

export default function MasterClassesPage() {
    const user = usePage().props.auth.user;

    const [classes, setClasses] = useState<MasterClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/beneficios');
            const data = (res.data as MasterClass[]).filter(
                (b) => b.kind === 'Master Class' || b.kind === 'Capacitacion',
            );
            setClasses(data);
        } catch {
            setClasses([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    function scoreMasterClass(query: string, mc: MasterClass): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const title = mc.title?.toLowerCase() ?? '';
        const instructor = mc.instructor?.toLowerCase() ?? '';
        if (title === q || title.startsWith(q)) return 100;
        if (title.includes(q)) return 90;
        if (instructor.includes(q)) return 70;
        return 0;
    }

    const filteredClasses = useMemo(() => {
        if (!search.trim()) return classes;
        return classes.filter((mc) => scoreMasterClass(search, mc) > 0);
    }, [classes, search]);

    return (
        <AuthenticatedLayout header="Master Classes">
            <Head title="Master Classes" />

            <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Capacitaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Canjea tus puntos por capacitaciones y master classes.
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Buscar por titulo, instructor..."
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
                    {filteredClasses.length} de {classes.length} clases
                </Typography>
            </Stack>

            {loading && filteredClasses.length === 0 && (
                <Typography variant="body2" color="text.secondary">Cargando capacitaciones...</Typography>
            )}

            <Grid container spacing={2.25}>
                {filteredClasses.map((mc) => (
                    <Grid key={mc.id} item xs={12} sm={6} md={4} lg={3}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box
                                sx={{
                                    height: 160,
                                    bgcolor: 'grey.100',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    position: 'relative',
                                    ...(mc.image_path
                                        ? {
                                              backgroundImage: `url(${mc.image_path})`,
                                              backgroundSize: 'cover',
                                              backgroundPosition: 'center',
                                          }
                                        : {}),
                                }}
                            >
                                <Box sx={{ position: 'absolute', left: 12, top: 12 }}>
                                    <Chip size="small" label={mc.modality ?? 'Por definir'} />
                                </Box>
                            </Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 900 }}>{mc.title}</Typography>
                                {mc.instructor && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Instructor: {mc.instructor}
                                    </Typography>
                                )}
                                <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                                    {mc.date && <Chip size="small" variant="outlined" label={mc.date} />}
                                    {mc.seats && <Chip size="small" variant="outlined" label={`Cupo: ${mc.seats}`} />}
                                </Stack>
                                {mc.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {mc.description}
                                    </Typography>
                                )}
                                <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Puntos requeridos
                                    </Typography>
                                    <Typography sx={{ fontWeight: 900 }}>{mc.points_cost}</Typography>
                                </Box>
                            </CardContent>
                            <CardActions sx={{ px: 2, pb: 2 }}>
                                <Button fullWidth variant="outlined" disabled>
                                    Inscribirme
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {!loading && filteredClasses.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {search ? 'Sin resultados para tu busqueda' : 'No hay capacitaciones disponibles.'}
                </Typography>
            )}
        </AuthenticatedLayout>
    );
}
