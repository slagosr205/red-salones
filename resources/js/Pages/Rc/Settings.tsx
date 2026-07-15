import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getReceiptConfig, type ReceiptConfig, saveReceiptConfig } from '@/rc/receipt';
import { toastSuccess, toastError } from '@/rc/toast';

type Article = {
    id: string;
    name: string;
    brand?: string;
    price?: number;
};

export default function SettingsPage() {
    const [cfg, setCfg] = useState<ReceiptConfig>(() => getReceiptConfig());
    const [saved, setSaved] = useState(false);

    const [membershipPrice, setMembershipPrice] = useState<number>(0);
    const [welcomeKitIds, setWelcomeKitIds] = useState<string[]>([]);
    const [discountPrice, setDiscountPrice] = useState<string>('');
    const [discountFrom, setDiscountFrom] = useState<string>('');
    const [discountUntil, setDiscountUntil] = useState<string>('');
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);

    const [articles, setArticles] = useState<Article[]>([]);

    useEffect(() => {
        setSaved(false);
    }, [cfg]);

    useEffect(() => {
        Promise.all([
            axios.get(route('rc.api.settings.index')),
            fetch('/api/catalogo-articulos').then((r) => r.json()),
        ]).then(([settingsRes, arts]) => {
            setMembershipPrice(settingsRes.data.membership_price ?? 0);
            setWelcomeKitIds(settingsRes.data.welcome_kit_articles ?? []);
            setDiscountPrice(settingsRes.data.membership_discount_price ?? '');
            setDiscountFrom(settingsRes.data.membership_discount_from ?? '');
            setDiscountUntil(settingsRes.data.membership_discount_until ?? '');
            setArticles(arts);
        }).catch(() => {}).finally(() => setSettingsLoading(false));
    }, []);

    const articleOptions = useMemo(() => {
        return articles.map((a) => ({
            id: a.id,
            label: `${a.name}${a.brand ? ` — ${a.brand}` : ''}`,
        }));
    }, [articles]);

    const selectedArticles = useMemo(() => {
        return articleOptions.filter((o) => welcomeKitIds.includes(o.id));
    }, [articleOptions, welcomeKitIds]);

    const handleSaveReceipt = () => {
        saveReceiptConfig(cfg);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleSaveMembership = useCallback(async () => {
        setSettingsSaving(true);
        try {
            await axios.put(route('rc.api.settings.update'), {
                membership_price: membershipPrice,
                welcome_kit_articles: welcomeKitIds,
                membership_discount_price: discountPrice !== '' ? Number(discountPrice) : null,
                membership_discount_from: discountFrom || null,
                membership_discount_until: discountUntil || null,
            });
            toastSuccess('Configuracion de membresia guardada.');
        } catch {
            toastError('Error al guardar configuracion.');
        }
        setSettingsSaving(false);
    }, [membershipPrice, welcomeKitIds, discountPrice, discountFrom, discountUntil]);

    return (
        <AuthenticatedLayout header="Configuracion">
            <Head title="Configuracion" />

            <Stack spacing={2.25}>
                {/* ─── Membresia ─── */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            Membresia y Kit de Bienvenida
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Define el costo de la membresia y los articulos incluidos en el kit de bienvenida
                            que se entregan al registrar un nuevo usuario.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        {settingsLoading ? (
                            <Stack alignItems="center" sx={{ py: 3 }}>
                                <CircularProgress size={28} />
                            </Stack>
                        ) : (
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Precio de la membresia (L)"
                                    value={membershipPrice}
                                    onChange={(e) => setMembershipPrice(Number(e.target.value))}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />

                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Descuento temporal (opcional)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Si se define un precio de descuento y un rango de fechas valido, se usara este precio en lugar del precio regular.
                                </Typography>

                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Precio con descuento (L)"
                                    value={discountPrice}
                                    onChange={(e) => setDiscountPrice(e.target.value)}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="date"
                                        label="Descuento desde"
                                        value={discountFrom}
                                        onChange={(e) => setDiscountFrom(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="date"
                                        label="Descuento hasta"
                                        value={discountUntil}
                                        onChange={(e) => setDiscountUntil(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                </Stack>

                                <Autocomplete
                                    multiple
                                    options={articleOptions}
                                    value={selectedArticles}
                                    onChange={(_, newValue) => {
                                        setWelcomeKitIds(newValue.map((v) => v.id));
                                    }}
                                    getOptionLabel={(option) => option.label}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                label={option.label}
                                                size="small"
                                            />
                                        ))
                                    }
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props}>
                                            {option.label}
                                        </Box>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Articulos del Kit de Bienvenida"
                                            placeholder="Buscar articulos..."
                                        />
                                    )}
                                />

                                <Box>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveMembership}
                                        disabled={settingsSaving}
                                        startIcon={settingsSaving ? <CircularProgress size={18} color="inherit" /> : undefined}
                                    >
                                        {settingsSaving ? 'Guardando...' : 'Guardar membresia'}
                                    </Button>
                                </Box>
                            </Stack>
                        )}
                    </CardContent>
                </Card>

                {/* ─── Recibo ─── */}
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
                            <Button variant="contained" onClick={handleSaveReceipt}>
                                {saved ? 'Guardado' : 'Guardar configuracion'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </AuthenticatedLayout>
    );
}
