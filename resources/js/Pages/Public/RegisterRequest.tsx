import { Head, router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';

export default function RegisterRequest() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
        open: false,
        severity: 'success',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(route('register.request.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ name, email }),
            });
            const data = await res.json();
            if (data.success) {
                router.visit(route('register.success'));
            } else {
                setSnackbar({ open: true, severity: 'error', message: data.message ?? 'Error al registrar' });
            }
        } catch {
            setSnackbar({ open: true, severity: 'error', message: 'Error de conexion' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Head title="Solicitar registro" />

            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                }}
            >
                <Container maxWidth="xs">
                    <Card>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, textAlign: 'center', mb: 1 }}>
                                Red Comercial de Salones
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                                Solicita tu registro como salon. Recibiras tus credenciales por correo.
                            </Typography>

                            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                                <TextField
                                    required
                                    size="small"
                                    label="Nombre del salon"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <TextField
                                    required
                                    size="small"
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Button type="submit" variant="contained" fullWidth disabled={saving}>
                                    {saving ? 'Enviando...' : 'Solicitar registro'}
                                </Button>
                            </Stack>

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                                <a href="/login" style={{ color: 'inherit' }}>¿Ya tienes cuenta? Inicia sesion</a>
                            </Typography>
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
