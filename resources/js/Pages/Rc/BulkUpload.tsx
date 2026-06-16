import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
    Alert,
} from '@mui/material';
import { CloudUpload, Download, UploadFile } from '@mui/icons-material';

export default function BulkUpload() {
    const [articleFile, setArticleFile] = useState<File | null>(null);
    const [stockFile, setStockFile] = useState<File | null>(null);
    const [stockMode, setStockMode] = useState('set');
    const [uploading, setUploading] = useState(false);
    const [articleResult, setArticleResult] = useState<string | null>(null);
    const [articleError, setArticleError] = useState<string | null>(null);
    const [stockResult, setStockResult] = useState<string | null>(null);
    const [stockError, setStockError] = useState<string | null>(null);

    const handleDownloadTemplate = () => {
        window.open(route('rc.bulk-upload.template'), '_blank');
    };

    const handleUploadArticles = async () => {
        if (!articleFile) return;
        setUploading(true);
        setArticleResult(null);
        setArticleError(null);
        const form = new FormData();
        form.append('file', articleFile);
        try {
            const res = await axios.post(route('rc.bulk-upload.articles'), form);
            setArticleResult(res.data.message ?? 'Articulos importados.');
        } catch (e: any) {
            setArticleError(e.response?.data?.message ?? 'Error al importar articulos.');
        }
        setUploading(false);
    };

    const handleUploadStock = async () => {
        if (!stockFile) return;
        setUploading(true);
        setStockResult(null);
        setStockError(null);
        const form = new FormData();
        form.append('file', stockFile);
        form.append('mode', stockMode);
        try {
            const res = await axios.post(route('rc.bulk-upload.stock'), form);
            setStockResult(res.data.message ?? 'Stock actualizado.');
        } catch (e: any) {
            setStockError(e.response?.data?.message ?? 'Error al actualizar stock.');
        }
        setUploading(false);
    };

    return (
        <AuthenticatedLayout header="Carga Masiva">
            <Head title="Carga Masiva" />

            <Stack spacing={3}>
                {/* Download template */}
                <Card>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Plantilla de articulos</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Descargue la plantilla CSV con el formato requerido para la carga masiva de articulos.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={handleDownloadTemplate}
                            >
                                Descargar plantilla
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Upload articles */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                            Cargar articulos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Seleccione un archivo CSV con los datos de los articulos a crear. Debe coincidir con la plantilla.
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadFile />}
                            >
                                {articleFile ? articleFile.name : 'Seleccionar archivo'}
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    hidden
                                    onChange={(e) => setArticleFile(e.target.files?.[0] ?? null)}
                                />
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<CloudUpload />}
                                onClick={handleUploadArticles}
                                disabled={!articleFile || uploading}
                            >
                                {uploading ? <CircularProgress size={20} /> : 'Subir'}
                            </Button>
                        </Stack>
                        {articleResult && <Alert severity="success" sx={{ mt: 2 }}>{articleResult}</Alert>}
                        {articleError && <Alert severity="error" sx={{ mt: 2 }}>{articleError}</Alert>}
                    </CardContent>
                </Card>

                {/* Upload stock */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                            Cargar stock
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            El CSV debe tener las columnas <strong>nombre</strong> o <strong>id</strong> y <strong>stock</strong>.
                        </Typography>
                        <FormControl sx={{ mb: 2 }}>
                            <RadioGroup row value={stockMode} onChange={(e) => setStockMode(e.target.value)}>
                                <FormControlLabel value="set" control={<Radio />} label="Asignar stock exacto" />
                                <FormControlLabel value="increment" control={<Radio />} label="Incrementar stock" />
                            </RadioGroup>
                        </FormControl>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadFile />}
                            >
                                {stockFile ? stockFile.name : 'Seleccionar archivo'}
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    hidden
                                    onChange={(e) => setStockFile(e.target.files?.[0] ?? null)}
                                />
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<CloudUpload />}
                                onClick={handleUploadStock}
                                disabled={!stockFile || uploading}
                            >
                                {uploading ? <CircularProgress size={20} /> : 'Subir'}
                            </Button>
                        </Stack>
                        {stockResult && <Alert severity="success" sx={{ mt: 2 }}>{stockResult}</Alert>}
                        {stockError && <Alert severity="error" sx={{ mt: 2 }}>{stockError}</Alert>}
                    </CardContent>
                </Card>
            </Stack>
        </AuthenticatedLayout>
    );
}
