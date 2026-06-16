import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';

export default function ArticlesCreate({ categories = [] }: { categories?: string[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        brand: '',
        category: '',
        price: '',
        leader_price: '',
        public_price: '',
        stock: '',
        points: '',
        summary: '',
        is_featured: false,
        image: null as File | null,
    });

    const [preview, setPreview] = useState('');

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('image', file);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(file ? URL.createObjectURL(file) : '');
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('rc.articles.store'));
    };

    return (
        <AuthenticatedLayout header="Crear Artículo">
            <Head title="Crear Artículo" />

            <Card sx={{ maxWidth: 640 }}>
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data">
                        <Stack spacing={2.5}>
                            <TextField
                                label="Nombre"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={!!errors.name}
                                helperText={errors.name}
                            />
                            <TextField
                                label="Marca"
                                value={data.brand}
                                onChange={(e) => setData('brand', e.target.value)}
                                error={!!errors.brand}
                                helperText={errors.brand}
                            />
                            <Autocomplete
                                freeSolo
                                options={categories}
                                value={data.category}
                                onInputChange={(_, v) => setData('category', v)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Categoría"
                                        error={!!errors.category}
                                        helperText={errors.category}
                                    />
                                )}
                            />
                            <TextField
                                label="Precio Salón"
                                type="number"
                                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                error={!!errors.price}
                                helperText={errors.price}
                            />
                            <TextField
                                label="Precio Líder"
                                type="number"
                                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                                value={data.leader_price}
                                onChange={(e) => setData('leader_price', e.target.value)}
                                error={!!errors.leader_price}
                                helperText={errors.leader_price}
                            />
                            <TextField
                                label="Precio Público (Consumidor Final)"
                                type="number"
                                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                                value={data.public_price}
                                onChange={(e) => setData('public_price', e.target.value)}
                                error={!!errors.public_price}
                                helperText={errors.public_price}
                            />
                            <TextField
                                label="Stock"
                                type="number"
                                slotProps={{ htmlInput: { min: 0 } }}
                                value={data.stock}
                                onChange={(e) => setData('stock', e.target.value)}
                                error={!!errors.stock}
                                helperText={errors.stock}
                            />
                            <TextField
                                label="Puntos"
                                type="number"
                                slotProps={{ htmlInput: { min: 0 } }}
                                value={data.points}
                                onChange={(e) => setData('points', e.target.value)}
                                error={!!errors.points}
                                helperText={errors.points}
                            />
                            <TextField
                                label="Resumen"
                                multiline
                                rows={3}
                                value={data.summary}
                                onChange={(e) => setData('summary', e.target.value)}
                                error={!!errors.summary}
                                helperText={errors.summary}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                    />
                                }
                                label="Mostrar como destacado en la página de inicio"
                            />
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Imagen (opcional, max 2MB)
                                </Typography>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImage}
                                />
                                {preview && (
                                    <Box
                                        component="img"
                                        src={preview}
                                        sx={{
                                            mt: 1.5,
                                            maxWidth: '100%',
                                            maxHeight: 300,
                                            objectFit: 'contain',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                )}
                                {errors.image && (
                                    <Typography variant="caption" color="error">
                                        {errors.image}
                                    </Typography>
                                )}
                            </Box>
                            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    onClick={() => window.history.back()}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="contained" disabled={processing}>
                                    {processing ? 'Guardando...' : 'Crear Artículo'}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
