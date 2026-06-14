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
} from '@mui/material';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

type Props = {
    open: boolean;
    onClose: () => void;
    amount: number;
    currency?: string;
    customerName: string;
    customerEmail: string;
    onPaymentSuccess: () => void;
};

export default function PaymentDialog({ open, onClose, amount, currency = 'hnl', customerName, customerEmail, onPaymentSuccess }: Props) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const amountCents = Math.round(amount * 100);

    const handleSubmit = async () => {
        if (!stripe || !elements) return;
        setProcessing(true);
        setError(null);

        try {
            const res = await fetch(route('rc.create-payment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ amount: amountCents, currency, customerName, customerEmail }),
            });

            const data = await res.json();
            if (!data.success) {
                setError(data.message ?? 'Error al iniciar el pago');
                setProcessing(false);
                return;
            }

            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: { card: elements.getElement(CardElement)! },
            });

            if (result.error) {
                setError(result.error.message ?? 'Error al procesar la tarjeta');
                setProcessing(false);
                return;
            }

            if (result.paymentIntent?.status === 'succeeded') {
                onPaymentSuccess();
                onClose();
            }
        } catch {
            setError('Error de conexion al procesar el pago');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onClose={processing ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Pago con tarjeta</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Cliente: {customerName} ({customerEmail})
                </Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        Total: L {amount.toFixed(2)}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.default',
                    }}
                >
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': { color: '#aab7c4' },
                                },
                                invalid: { color: '#9e2146' },
                            },
                        }}
                    />
                </Box>

                {error && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={processing}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!stripe || processing}>
                    {processing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    {processing ? 'Procesando...' : `Pagar L ${amount.toFixed(2)}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
