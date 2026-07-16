import { Head, router } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { AccountBalance, CreditCard, Inventory2, Payments } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import TodoPagoPaymentDialog from '@/Components/TodoPagoPaymentDialog';

import { toastError, toastSuccess } from '@/rc/toast';

type KitArticle = {
    id: string;
    name: string;
    brand: string | null;
    price: number | null;
    image: string | null;
};

type PaymentMethod = 'efectivo' | 'tc' | 'td';

const paymentLabels: Record<PaymentMethod, string> = {
    efectivo: 'Efectivo',
    tc: 'Tarjeta de Credito',
    td: 'Tarjeta de Debito',
};

export default function RegisterRequest() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);

    const [step, setStep] = useState(0);
    const [membershipPrice, setMembershipPrice] = useState(0);
    const [kitArticles, setKitArticles] = useState<KitArticle[]>([]);
    const [membershipLoading, setMembershipLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    useEffect(() => {
        fetch('/api/membresia')
            .then((r) => r.json())
            .then((data) => {
                setMembershipPrice(data.price ?? 0);
                setKitArticles(data.articles ?? []);
            })
            .catch(() => {})
            .finally(() => setMembershipLoading(false));
    }, []);

    const subtotal = membershipPrice;
    const isv = subtotal * 0.15;
    const grandTotal = subtotal + isv;

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        setStep(1);
    };

    const handlePay = async (transaccionId?: number, cardMasked?: string) => {
        setSaving(true);
        try {
            const body: Record<string, any> = { name, email, payment_method: paymentMethod };
            if (transaccionId) body.todopago_transaccion_id = transaccionId;
            if (cardMasked) body.todopago_card_number_masked = cardMasked;
            const res = await fetch('/api/membresia/pagar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess(data.message ?? 'Membresia pagada.');
                router.visit(route('register.success'));
            } else {
                toastError(data.message ?? 'Error al procesar el pago');
            }
        } catch {
            toastError('Error de conexion');
        } finally {
            setSaving(false);
        }
    };

    const handlePayClick = () => {
        if (paymentMethod === 'tc' || paymentMethod === 'td') {
            setPaymentDialogOpen(true);
        } else {
            handlePay();
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
                    py: 4,
                }}
            >
                <Container maxWidth="sm">
                    <Card>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, textAlign: 'center', mb: 1 }}>
                                Red Pro Beauty
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                                Registrate y accede a tu kit de bienvenida
                            </Typography>

                            <Stepper activeStep={step} sx={{ mb: 3 }}>
                                <Step>
                                    <StepLabel>Datos</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>Pago</StepLabel>
                                </Step>
                            </Stepper>

                            {step === 0 && (
                                <Stack component="form" spacing={2} onSubmit={handleNext}>
                                    <TextField
                                        required
                                        size="small"
                                        label="Nombre del salon o negocio"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        required
                                        size="small"
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        fullWidth
                                    />
                                    <Button type="submit" variant="contained" fullWidth>
                                        Continuar
                                    </Button>
                                </Stack>
                            )}

                            {step === 1 && (
                                <Stack spacing={2.5}>
                                    {membershipLoading ? (
                                        <Stack alignItems="center" sx={{ py: 3 }}>
                                            <CircularProgress size={28} />
                                        </Stack>
                                    ) : (
                                        <>
                                            {/* ─── Resumen de pago ─── */}
                                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                                                    Resumen de compra
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="body2" color="text.secondary">Membresia</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>L {subtotal.toFixed(2)}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="body2" color="text.secondary">ISV (15%)</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>L {isv.toFixed(2)}</Typography>
                                                    </Stack>
                                                    <Divider />
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography sx={{ fontWeight: 900 }}>Total a pagar</Typography>
                                                        <Typography sx={{ fontWeight: 900 }}>L {grandTotal.toFixed(2)}</Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>

                                            {/* ─── Kit de bienvenida ─── */}
                                            {kitArticles.length > 0 && (
                                                <Box>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                        <Inventory2 color="primary" sx={{ fontSize: 20 }} />
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                            Tu kit de bienvenida incluye:
                                                        </Typography>
                                                    </Stack>
                                                    <Grid container spacing={1}>
                                                        {kitArticles.map((art) => (
                                                            <Grid key={art.id} item xs={6}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                                                                    <Box
                                                                        sx={{
                                                                            width: 36,
                                                                            height: 36,
                                                                            borderRadius: 0.5,
                                                                            bgcolor: 'grey.200',
                                                                            background: art.image ? `url(${art.image}) center/cover no-repeat` : undefined,
                                                                            display: 'grid',
                                                                            placeItems: 'center',
                                                                            flexShrink: 0,
                                                                            overflow: 'hidden',
                                                                        }}
                                                                    >
                                                                        {!art.image && <Inventory2 sx={{ fontSize: 16, color: 'text.disabled' }} />}
                                                                    </Box>
                                                                    <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
                                                                        {art.name}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            )}

                                            {/* ─── Metodo de pago ─── */}
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                                                    Metodo de pago
                                                </Typography>
                                                <ToggleButtonGroup
                                                    value={paymentMethod}
                                                    exclusive
                                                    onChange={(_, v) => v && setPaymentMethod(v)}
                                                    fullWidth
                                                    size="small"
                                                >
                                                    <ToggleButton value="efectivo" sx={{ textTransform: 'none' }}>
                                                        <AccountBalance sx={{ mr: 0.5, fontSize: 18 }} />
                                                        Efectivo
                                                    </ToggleButton>
                                                    <ToggleButton value="tc" sx={{ textTransform: 'none' }}>
                                                        <CreditCard sx={{ mr: 0.5, fontSize: 18 }} />
                                                        TC
                                                    </ToggleButton>
                                                    <ToggleButton value="td" sx={{ textTransform: 'none' }}>
                                                        <Payments sx={{ mr: 0.5, fontSize: 18 }} />
                                                        TD
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            </Box>

                                            <Stack direction="row" spacing={1}>
                                                <Button variant="outlined" onClick={() => setStep(0)} sx={{ flex: 1 }}>
                                                    Atras
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handlePayClick}
                                                    disabled={saving}
                                                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
                                                    sx={{ flex: 2, fontWeight: 700 }}
                                                >
                                                    {saving ? 'Procesando...' : `Pagar L ${grandTotal.toFixed(2)}`}
                                                </Button>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            )}

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                                <a href="/login" style={{ color: 'inherit' }}>¿Ya tienes cuenta? Inicia sesion</a>
                            </Typography>
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            <TodoPagoPaymentDialog
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                amount={subtotal}
                currency="hnl"
                taxes={isv}
                customerName={name}
                customerEmail={email}
                onPaymentSuccess={async (transaccionId, cardMasked) => {
                    await handlePay(transaccionId, cardMasked);
                }}
            />
        </>
    );
}
