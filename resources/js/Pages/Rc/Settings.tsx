import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { getReceiptConfig, type ReceiptConfig, saveReceiptConfig } from '@/rc/receipt';

export default function SettingsPage() {
    const [cfg, setCfg] = useState<ReceiptConfig>(() => getReceiptConfig());
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSaved(false);
    }, [cfg]);

    const handleSave = () => {
        saveReceiptConfig(cfg);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <AuthenticatedLayout header="Configuracion">
            <Head title="Configuracion" />

            <Stack spacing={2.25}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            Preferencias
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Prototipo: opciones UI. En produccion se guardan por usuario.
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                            <TextField fullWidth size="small" label="Nombre de la red" defaultValue="Red Comercial" />
                        </Box>
                        <Stack spacing={1} sx={{ mt: 2 }}>
                            <Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Feedback inmediato (snackbar/toast)"
                                    defaultValue="Habilitado"
                                    disabled
                                />
                            </Box>
                            <Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Sidebar colapsable en tablet/mobile"
                                    defaultValue="Habilitado"
                                    disabled
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            Configuracion del Recibo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Datos de la empresa que aparecen en el recibo de compra.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Nombre de la empresa"
                                value={cfg.companyName}
                                onChange={(e) => setCfg({ ...cfg, companyName: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Telefono"
                                value={cfg.phone}
                                onChange={(e) => setCfg({ ...cfg, phone: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Direccion"
                                value={cfg.address}
                                onChange={(e) => setCfg({ ...cfg, address: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Correo electronico"
                                value={cfg.email}
                                onChange={(e) => setCfg({ ...cfg, email: e.target.value })}
                            />
                        </Stack>

                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleSave}>
                                {saved ? 'Guardado' : 'Guardar configuracion'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </AuthenticatedLayout>
    );
}
