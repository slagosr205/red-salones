import { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    CircularProgress,
    TextField,
    InputAdornment,
} from '@mui/material';
import axios from 'axios';

type Props = {
    open: boolean;
    onClose: () => void;
    amount: number;
    currency?: string;
    taxes?: number;
    discount?: number;
    customerName: string;
    customerEmail: string;
    onPaymentSuccess: (transaccionId: number, cardMasked?: string) => Promise<void>;
};

export default function TodoPagoPaymentDialog({
    open,
    onClose,
    amount,
    currency = 'hnl',
    taxes,
    discount,
    customerName,
    customerEmail,
    onPaymentSuccess,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolderName, setCardHolderName] = useState(customerName);
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvc, setCvc] = useState('');

    const resetForm = () => {
        setCardNumber('');
        setCardHolderName(customerName);
        setExpiryMonth('');
        setExpiryYear('');
        setCvc('');
        setError(null);
    };

    const handleClose = () => {
        if (processing) return;
        resetForm();
        onClose();
    };

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const handleSubmit = async () => {
        setError(null);

        const cleanCard = cardNumber.replace(/\s/g, '');
        if (cleanCard.length < 13) {
            setError('Número de tarjeta inválido');
            return;
        }
        if (!cardHolderName.trim()) {
            setError('Nombre del titular requerido');
            return;
        }
        const m = expiryMonth.replace(/\D/g, '').slice(0, 2);
        if (!m || parseInt(m) < 1 || parseInt(m) > 12) {
            setError('Mes de expiración inválido');
            return;
        }
        let y = expiryYear.replace(/\D/g, '').slice(0, 4);
        if (!y || y.length < 2) {
            setError('Año de expiración inválido');
            return;
        }
        y = y.length === 4 ? y.slice(-2) : y;
        const c = cvc.replace(/\D/g, '').slice(0, 4);
        if (!c || c.length < 3) {
            setError('Código de seguridad inválido');
            return;
        }

        setProcessing(true);

        try {
            const res = await axios.post(route('api.todopago.direct-payment'), {
                accountNumber: cleanCard,
                cardHolderName: cardHolderName.trim(),
                expirationMonth: m,
                expirationYear: y,
                cvc: c,
                amount,
                currency,
                taxes,
                discount,
                customerName,
                customerEmail,
                externalReference: 'rc-' + Date.now(),
            });

            const body = res.data;

            if (body.ok === true || body.status === 200) {
                const transaccionID = body.data?.transaccionID ?? body.data?.transactionID;
                if (transaccionID) {
                    const voucher = body.data?.voucher ?? [];
                    const cardEntry = voucher.find((v: any) => v.name === 'Tarjeta');
                    const cardMasked = cardEntry?.value ?? undefined;
                    await onPaymentSuccess(transaccionID, cardMasked);
                    resetForm();
                    onClose();
                    return;
                }
                setError('Respuesta inesperada del gateway');
                setProcessing(false);
            } else {
                setError(body.message ?? 'Error al procesar el pago');
                setProcessing(false);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message
                ?? err?.response?.data?.error
                ?? 'Error de conexión al procesar el pago';
            setError(msg);
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>Pago con tarjeta (TodoPago)</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Cliente: {customerName} ({customerEmail})
                </Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        Total: L {(amount + (taxes ?? 0)).toFixed(2)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Número de tarjeta"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        fullWidth
                        disabled={processing}
                        inputProps={{ inputMode: 'numeric', maxLength: 19 }}
                    />
                    <TextField
                        label="Titular de la tarjeta"
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="Nombre como aparece en la tarjeta"
                        fullWidth
                        disabled={processing}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Mes"
                            value={expiryMonth}
                            onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            placeholder="MM"
                            fullWidth
                            disabled={processing}
                            inputProps={{ inputMode: 'numeric', maxLength: 2 }}
                        />
                        <TextField
                            label="Año"
                            value={expiryYear}
                            onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="AAAA"
                            fullWidth
                            disabled={processing}
                            inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                        />
                        <TextField
                            label="CVC"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            fullWidth
                            disabled={processing}
                            inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                        />
                    </Box>
                </Box>

                {error && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={processing}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={processing}>
                    {processing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    {processing ? 'Procesando...' : `Pagar L ${(amount + (taxes ?? 0)).toFixed(2)}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
