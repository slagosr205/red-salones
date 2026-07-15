import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add,
    Delete,
    Edit,
    ImageNotSupported,
    Search,
    Star,
    StarBorder,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';

interface Article {
    id: number;
    name: string;
    brand: string | null;
    category: string | null;
    price: number | null;
    leader_price: number | null;
    summary: string | null;
    image_path: string | null;
    is_featured: boolean;
    created_by: number;
    creator: { id: number; name: string } | null;
    created_at: string;
}

function scoreArticle(query: string, a: Article): number {
    const q = query.trim().toLowerCase();
    if (!q) return 1;
    const name = a.name?.toLowerCase() ?? '';
    const brand = a.brand?.toLowerCase() ?? '';
    const category = a.category?.toLowerCase() ?? '';
    const creator = a.creator?.name?.toLowerCase() ?? '';
    if (name === q || name.startsWith(q)) return 100;
    if (name.includes(q)) return 90;
    if (brand.includes(q)) return 70;
    if (category.includes(q)) return 60;
    if (creator.includes(q)) return 50;
    return 0;
}

export default function Articles({ articles }: { articles: Article[] }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const filtered = useMemo(() => {
        if (!search.trim()) return articles;
        return articles.filter((a) => scoreArticle(search, a) > 0);
    }, [articles, search]);

    const paginated = useMemo(
        () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filtered, page, rowsPerPage],
    );

    return (
        <AuthenticatedLayout header="Artículos Publicitarios">
            <Head title="Artículos" />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack spacing={0.25}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        Artículos Publicitarios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gestiona los artículos destacados que aparecen en la página de inicio.
                    </Typography>
                </Stack>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    component={Link}
                    href={route('rc.articles.create')}
                >
                    Nuevo Artículo
                </Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Buscar por nombre, marca, categoria..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                        },
                    }}
                    sx={{ minWidth: 300 }}
                />
                <Typography variant="body2" color="text.secondary">
                    {filtered.length} de {articles.length} artículos
                </Typography>
            </Stack>

            <Card>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }} width={72}></TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Nombre</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Marca</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Categoría</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Precio Salón</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Precio Líder</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Destacado</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Creado por</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }} align="right">
                                            Acciones
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginated.map((a) => (
                                        <TableRow key={a.id} hover>
                                            <TableCell>
                                                {a.image_path ? (
                                                    <Box
                                                        component="img"
                                                        src={`/storage/${a.image_path}`}
                                                        alt={a.name}
                                                        sx={{ width: 44, height: 44, borderRadius: 1, objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <ImageNotSupported sx={{ fontSize: 28, color: 'action.disabled' }} />
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                                            <TableCell>{a.brand ?? '—'}</TableCell>
                                            <TableCell>
                                                {a.category ? (
                                                    <Chip label={a.category} size="small" />
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {a.price != null ? `L ${Number(a.price).toFixed(2)}` : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {a.leader_price != null ? `L ${Number(a.leader_price).toFixed(2)}` : '—'}
                                            </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    router.post(
                                                        route('rc.articles.toggle-featured', a.id),
                                                    )
                                                }
                                                color={a.is_featured ? 'warning' : 'default'}
                                            >
                                                {a.is_featured ? <Star /> : <StarBorder />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>{a.creator?.name ?? '—'}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <IconButton
                                                    size="small"
                                                    component={Link}
                                                    href={route('rc.articles.edit', a.id)}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `¿Eliminar "${a.name}"?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                route('rc.articles.destroy', a.id),
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography color="text.secondary">
                                                {search ? 'Sin resultados para tu busqueda' : 'No hay artículos aún.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={filtered.length}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Artículos por página"
                        labelDisplayedRows={({ from, to, count }) =>
                            `Mostrando ${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
                        }
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
