import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from '@mui/material';
import { Print, Email } from '@mui/icons-material';
import { useMemo, useState } from 'react';

import type { Product } from '@/rc/mock';
import { getPromotionsForProduct } from '@/rc/promotions';
import { getReceiptConfig } from '@/rc/receipt';
import { toastSuccess, toastError } from '@/rc/toast';

type LineItem = {
    product: Product;
    qty: number;
    total: number;
    discount: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    items: LineItem[];
    customerName: string;
    date: string;
};

function promoLabel(p: Product): string | null {
    const promos = getPromotionsForProduct(p.id);
    if (promos.length === 0) return null;
    const promo = promos[0];
    if (promo.type === '2x1') return '2x1';
    return `${promo.value}%OFF`;
}

export default function ReceiptDialog({ open, onClose, items, customerName, date }: Props) {
    const cfg = getReceiptConfig();

    const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);
    const totalDiscount = useMemo(() => items.reduce((s, i) => s + i.discount, 0), [items]);
    const taxable = subtotal - totalDiscount;
    const isv = taxable * 0.15;
    const grandTotal = taxable + isv;

    const receiptId = `R-${date.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        setPrinting(true);
        try {
            const res = await fetch(route('rc.print.receipt'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' },
                body: JSON.stringify({
                    receiptId,
                    date,
                    customerName,
                    companyName: cfg.companyName,
                    companyAddress: cfg.address,
                    companyPhone: cfg.phone,
                    companyEmail: cfg.email,
                    items: items.map((i) => ({
                        name: i.product.name,
                        qty: i.qty,
                        price: i.product.price,
                        discount: i.discount,
                        promo: promoLabel(i.product),
                    })),
                    subtotal,
                    totalDiscount,
                    isv,
                    grandTotal,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toastSuccess(data.message);
            } else {
                toastError(data.message);
            }
        } catch {
            toastError('Error de conexion al imprimir');
        } finally {
            setPrinting(false);
        }
    };

    const handleEmail = () => {
        const itemsText = items
            .map((i) => {
                const promo = promoLabel(i.product) ? ` [${promoLabel(i.product)}]` : '';
                const dto = i.discount > 0 ? ` (dto: L ${i.discount.toFixed(2)})` : '';
                return `  ${i.product.name} x${i.qty} = L ${(i.total - i.discount).toFixed(2)}${promo}${dto}`;
            })
            .join('\n');
        const subject = encodeURIComponent(`Recibo ${receiptId} - ${cfg.companyName}`);
        const body = encodeURIComponent(
            `${cfg.companyName}\n${cfg.address}\nTel: ${cfg.phone}\n\n` +
            `Recibo: ${receiptId}\nFecha: ${date}\nCliente: ${customerName}\n\n` +
            `${'-'.repeat(36)}\n${itemsText}\n${'-'.repeat(36)}\n\n` +
            `Subtotal: L ${subtotal.toFixed(2)}\n` +
            (totalDiscount > 0 ? `Descuento: -L ${totalDiscount.toFixed(2)}\n` : '') +
            `ISV (15%): L ${isv.toFixed(2)}\n` +
            `TOTAL: L ${grandTotal.toFixed(2)}\n\n` +
            `Gracias por su compra\nPrototipo — sin valor fiscal`,
        );
        window.open(`mailto:${cfg.email}?subject=${subject}&body=${body}`, '_blank');
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
                <DialogTitle>Recibo POS #{receiptId}</DialogTitle>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                        sx={{
                            width: 320,
                            fontFamily: '"Courier New", monospace',
                            fontSize: 12,
                            lineHeight: 1.4,
                            color: '#000',
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 2,
                        }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'inherit', letterSpacing: 2 }}>
                                {cfg.companyName}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ fontFamily: 'inherit' }}>
                                {cfg.address}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ fontFamily: 'inherit' }}>
                                Tel: {cfg.phone} | {cfg.email}
                            </Typography>
                        </Box>

                        <Typography sx={{ fontFamily: 'inherit', letterSpacing: 3, textAlign: 'center' }}>
                            {'-'.repeat(42)}
                        </Typography>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>#{receiptId}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>{date}</Typography>
                        </Stack>
                        <Typography variant="caption" display="block" sx={{ fontFamily: 'inherit', mb: 0.5 }}>
                            Cliente: {customerName}
                        </Typography>

                        <Typography sx={{ fontFamily: 'inherit', letterSpacing: 3, textAlign: 'center' }}>
                            {'-'.repeat(42)}
                        </Typography>

                        <Box sx={{ width: '100%' }}>
                            {items.map((i) => {
                                const promo = promoLabel(i.product);
                                const name = i.product.name.length > 22 ? i.product.name.slice(0, 20) + '..' : i.product.name;
                                const priceStr = `L ${i.product.price.toFixed(2)}`;
                                const qtyStr = `x${i.qty}`;
                                const netStr = `L ${(i.total - i.discount).toFixed(2)}`;
                                return (
                                    <Box key={i.product.id} sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 700 }}>
                                            {name}{promo ? ` [${promo}]` : ''}
                                        </Typography>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
                                                {'  '}{priceStr} {qtyStr}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 700 }}>
                                                {netStr}
                                            </Typography>
                                        </Stack>
                                        {i.discount > 0 && (
                                            <Typography variant="caption" sx={{ fontFamily: 'inherit', color: '#d32f2f' }}>
                                                {'  '}Dto: -L {i.discount.toFixed(2)}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        <Typography sx={{ fontFamily: 'inherit', letterSpacing: 3, textAlign: 'center' }}>
                            {'-'.repeat(42)}
                        </Typography>

                        <Stack spacing={0.25} sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
                                Subtotal: L {subtotal.toFixed(2)}
                            </Typography>
                            {totalDiscount > 0 && (
                                <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#d32f2f' }}>
                                    Descuento: -L {totalDiscount.toFixed(2)}
                                </Typography>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'inherit' }}>
                                ISV (15%): L {isv.toFixed(2)}
                            </Typography>
                            <Typography sx={{ fontFamily: 'inherit', letterSpacing: 2 }}>
                                {'-'.repeat(42)}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'inherit' }}>
                                TOTAL: L {grandTotal.toFixed(2)}
                            </Typography>
                        </Stack>

                        <Typography sx={{ fontFamily: 'inherit', letterSpacing: 3, textAlign: 'center' }}>
                            {'-'.repeat(42)}
                        </Typography>

                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'inherit' }}>
                                Gracias por su compra
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
                                Prototipo — sin valor fiscal
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 1, pb: 2 }}>
                    <Button onClick={onClose}>Cerrar</Button>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        disabled={printing}
                    >
                        {printing ? 'Imprimiendo...' : 'Imprimir'}
                    </Button>
                    <Button variant="contained" startIcon={<Email />} onClick={handleEmail}>
                        Enviar por correo
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
