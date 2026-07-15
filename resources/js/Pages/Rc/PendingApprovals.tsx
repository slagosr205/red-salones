import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useState } from 'react';

type PendingUser = {
    id: number;
    name: string;
    email: string;
    leader_id: number | null;
    created_at: string;
    orders_count: number;
};

export default function PendingApprovals() {
    const props = usePage().props as unknown as { pending: PendingUser[]; membershipPrice: number };
    const { pending, membershipPrice } = props;
    const [clientTypes, setClientTypes] = useState<Record<number, string>>({});
    const [paymentMethods, setPaymentMethods] = useState<Record<number, string>>({});

    const handleApprove = (id: number) => {
        const clientType = clientTypes[id];
        const paymentMethod = paymentMethods[id];
        if (!clientType) {
            alert('Selecciona el tipo de cliente (Salón o Consumidor Final) antes de aprobar.');
            return;
        }
        if (!paymentMethod) {
            alert('Selecciona el metodo de cobro de membresia antes de aprobar.');
            return;
        }
        router.post(route('rc.approve', id), {
            client_type: clientType,
            payment_method: paymentMethod,
        });
    };

    return (
        <AuthenticatedLayout header="Aprobaciones pendientes">
            <Head title="Aprobaciones pendientes" />

            <Box sx={{ maxWidth: 720 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Al aprobar se generara automaticamente el pedido de membresia y se registrara el cobro.
                    {membershipPrice > 0 && (
                        <Typography component="span" sx={{ fontWeight: 700 }}>
                            {' '}Precio: L {membershipPrice.toFixed(2)} + 15% ISV
                        </Typography>
                    )}
                </Alert>

                {pending.length === 0 && (
                    <Typography color="text.secondary">No hay solicitudes pendientes.</Typography>
                )}

                <Stack spacing={1.5}>
                    {pending.map((u) => (
                        <Card key={u.id}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
                                    <Box sx={{ minWidth: 180 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography sx={{ fontWeight: 700 }}>{u.name}</Typography>
                                            {u.orders_count > 0 && (
                                                <Chip label="Ya tiene pedido" size="small" color="success" variant="outlined" />
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Solicitado: {new Date(u.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Tipo de cliente</InputLabel>
                                            <Select
                                                value={clientTypes[u.id] ?? ''}
                                                label="Tipo de cliente"
                                                onChange={(e) => setClientTypes((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                            >
                                                <MenuItem value="salon">Salon</MenuItem>
                                                <MenuItem value="consumidor_final">Consumidor Final</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Cobro membresia</InputLabel>
                                            <Select
                                                value={paymentMethods[u.id] ?? ''}
                                                label="Cobro membresia"
                                                onChange={(e) => setPaymentMethods((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                            >
                                                <MenuItem value="efectivo">Efectivo</MenuItem>
                                                <MenuItem value="tc">Tarjeta Credito</MenuItem>
                                                <MenuItem value="td">Tarjeta Debito</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleApprove(u.id)}
                                        >
                                            Aprobar
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={() => {
                                                if (confirm(`Rechazar a ${u.name}?`)) {
                                                    router.post(route('rc.reject', u.id));
                                                }
                                            }}
                                        >
                                            Rechazar
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            </Box>
        </AuthenticatedLayout>
    );
}
