import { router } from '@inertiajs/react';
import { Close, Email, Print } from '@mui/icons-material';
import {
    Box,
    Button,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';

export type MemberData = {
    name: string;
    id: string;
    level: string;
    since: string;
    expires: string;
};

type AffiliateCardModalProps = {
    open: boolean;
    onClose: () => void;
    user: {
        id: number;
        name: string;
        created_at: string;
    };
};

function buildMember(user: { id: number; name: string; created_at: string }): MemberData {
    const date = new Date(user.created_at);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const since = `${months[date.getMonth()]} ${date.getFullYear()}`;
    const expiresDate = new Date(date);
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    const expires = `${months[expiresDate.getMonth()]} ${expiresDate.getFullYear()}`;

    return {
        name: user.name.toUpperCase(),
        id: `RC-${date.getFullYear()}-${String(user.id).padStart(5, '0')}`,
        level: 'PLATINUM',
        since,
        expires,
    };
}

export default function AffiliateCardModal({ open, onClose, user }: AffiliateCardModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [flipped, setFlipped] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [scanning, setScanning] = useState(false);
    const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'complete'>('idle');
    const [visible, setVisible] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');

    const member = buildMember(user);

    useEffect(() => {
        QRCode.toDataURL(member.id, {
            width: 160,
            margin: 1,
            color: { dark: '#1a1a1a', light: '#ffffff' },
        }).then(setQrDataUrl);
    }, [member.id]);

    useEffect(() => {
        if (open) {
            setFlipped(false);
            setTilt({ x: 0, y: 0 });
            setScanning(false);
            setScanPhase('idle');
            const t = setTimeout(() => setVisible(true), 30);
            return () => clearTimeout(t);
        } else {
            setVisible(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current;
        if (!el || flipped || scanning) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -16, y: x * 16 });
    };

    const handleMouseLeave = () => {
        if (!scanning) setTilt({ x: 0, y: 0 });
    };

    const handlePrint = useCallback(() => {
        if (scanning) return;
        setScanning(true);
        setScanPhase('scanning');

        setTimeout(() => {
            setScanPhase('complete');
            setTimeout(() => {
                setScanPhase('idle');
                setScanning(false);
                window.print();
            }, 500);
        }, 1400);
    }, [scanning]);

    const handleSendEmail = () => {
        router.post(route('rc.users.carnet.send', user.id), {}, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    if (!open) return null;

    return (
        <>
            <Box
                onClick={onClose}
                sx={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1400,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'grid',
                    placeItems: 'center',
                    animation: visible ? 'modalFadeIn 0.3s ease-out forwards' : 'none',
                    '@media print': {
                        bgcolor: 'common.white',
                        backdropFilter: 'none',
                    },
                }}
            >
                <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
                        opacity: visible ? 1 : 0,
                        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                        '@media print': {
                            transform: 'none',
                            opacity: 1,
                        },
                    }}
                >
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: -48,
                            right: -8,
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { color: 'common.white', bgcolor: 'rgba(255,255,255,0.1)' },
                            '@media print': { display: 'none' },
                        }}
                    >
                        <Close />
                    </IconButton>

                    <Box
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => { if (!scanning) setFlipped((f) => !f); }}
                        sx={{
                            perspective: 1200,
                            width: 400,
                            height: 252,
                            cursor: scanning ? 'default' : 'pointer',
                            position: 'relative',
                            '@media print': {
                                width: 400,
                                height: 252,
                                cursor: 'default',
                                printColorAdjust: 'exact',
                                WebkitPrintColorAdjust: 'exact',
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transition: scanning
                                    ? 'none'
                                    : 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                                transform: flipped
                                    ? 'rotateY(180deg)'
                                    : `rotateX(${scanning ? 0 : tilt.x}deg) rotateY(${scanning ? 0 : tilt.y}deg)`,
                                '@media print': {
                                    transform: 'rotateY(0deg)',
                                },
                            }}
                        >
                            {/* Front */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    borderRadius: 4,
                                    background:
                                        'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #7b1fa2 100%)',
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow:
                                        '0 20px 60px rgba(233,30,99,0.3), 0 8px 20px rgba(0,0,0,0.15)',
                                    transition: scanPhase === 'complete'
                                        ? 'filter 300ms ease, brightness 300ms ease'
                                        : 'none',
                                    filter: scanPhase === 'complete' ? 'brightness(1.08) saturate(1.1)' : 'none',
                                    '@media print': {
                                        boxShadow: 'none',
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact',
                                    },
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 2.5,
                                                display: 'grid',
                                                placeItems: 'center',
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                color: 'common.white',
                                                fontWeight: 950,
                                                letterSpacing: -0.5,
                                                fontSize: 18,
                                            }}
                                        >
                                            RC
                                        </Box>
                                    </Box>
                                    <Typography
                                        sx={{
                                            color: 'rgba(255,255,255,0.85)',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.2,
                                        }}
                                    >
                                        Afiliado
                                    </Typography>
                                </Stack>

                                <Box>
                                    <Typography
                                        sx={{
                                            color: 'common.white',
                                            fontWeight: 950,
                                            fontSize: 28,
                                            letterSpacing: 1,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {member.name}
                                    </Typography>
                                    <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    color: 'rgba(255,255,255,0.6)',
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                Membresía
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: 'common.white',
                                                    fontWeight: 900,
                                                    fontSize: 14,
                                                    mt: 0.25,
                                                }}
                                            >
                                                {member.level}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    color: 'rgba(255,255,255,0.6)',
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                ID
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: 'common.white',
                                                    fontWeight: 900,
                                                    fontSize: 14,
                                                    mt: 0.25,
                                                }}
                                            >
                                                {member.id}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                                    <Box>
                                        <Typography
                                            sx={{
                                                color: 'rgba(255,255,255,0.5)',
                                                fontSize: 8,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.8,
                                            }}
                                        >
                                            Red Comercial de Salones
                                        </Typography>
                                        <Typography
                                            sx={{
                                                color: 'rgba(255,255,255,0.4)',
                                                fontSize: 8,
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            Salones Profesionales
                                        </Typography>
                                    </Box>
                                    <Typography
                                        sx={{
                                            color: 'rgba(255,255,255,0.5)',
                                            fontSize: 9,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Desde {member.since}
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Back */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    borderRadius: 4,
                                    bgcolor: 'common.white',
                                    p: 2.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow:
                                        '0 20px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    '@media print': {
                                        boxShadow: 'none',
                                        border: '1px solid #ccc',
                                    },
                                }}
                            >
                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 10,
                                            color: 'text.secondary',
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.2,
                                        }}
                                    >
                                        Red Comercial de Salones
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', fontSize: 8 }}
                                    >
                                        Reverso — seguridad
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                                    {qrDataUrl && (
                                        <Box
                                            component="img"
                                            src={qrDataUrl}
                                            alt="QR de seguridad"
                                            sx={{
                                                width: 110,
                                                height: 110,
                                                borderRadius: 1.5,
                                                border: '1px solid',
                                                borderColor: 'grey.200',
                                                '@media print': {
                                                    printColorAdjust: 'exact',
                                                    WebkitPrintColorAdjust: 'exact',
                                                },
                                            }}
                                        />
                                    )}
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontSize: 14,
                                                letterSpacing: 3,
                                                color: 'text.secondary',
                                                fontWeight: 700,
                                                mb: 0.5,
                                            }}
                                        >
                                            {member.id}
                                        </Typography>
                                        <Stack direction="row" spacing={3} justifyContent="center">
                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 8,
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        color: 'text.secondary',
                                                        letterSpacing: 0.6,
                                                    }}
                                                >
                                                    Emisión
                                                </Typography>
                                                <Typography sx={{ fontSize: 10, fontWeight: 800, mt: 0.15 }}>
                                                    {member.since}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 8,
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        color: 'text.secondary',
                                                        letterSpacing: 0.6,
                                                    }}
                                                >
                                                    Vence
                                                </Typography>
                                                <Typography sx={{ fontSize: 10, fontWeight: 800, mt: 0.15 }}>
                                                    {member.expires}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Stack>

                                <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    sx={{ textAlign: 'center', fontSize: 7 }}
                                >
                                    Escanea el código QR para verificar la autenticidad
                                    de este carnet. Su uso es personal e intransferible.
                                </Typography>
                            </Box>

                            {/* Scan overlay */}
                            {scanPhase === 'scanning' && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: '-10%',
                                            right: '-10%',
                                            height: 4,
                                            background:
                                                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 70%, transparent 100%)',
                                            boxShadow:
                                                '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4)',
                                            animation: 'modalScanMove 1.4s ease-in-out forwards',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 60%, transparent 100%)',
                                            animation: 'modalScanGlow 1.4s ease-in-out forwards',
                                        }}
                                    />
                                </Box>
                            )}

                            {scanPhase === 'complete' && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: -8,
                                        borderRadius: 5,
                                        background:
                                            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), transparent 70%)',
                                        animation: 'modalScanFlash 0.5s ease-out forwards',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            '@media print': { display: 'none' },
                        }}
                    >
                        <Button
                            variant="contained"
                            startIcon={<Print />}
                            onClick={handlePrint}
                            disabled={scanning}
                            sx={{
                                background:
                                    'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                                boxShadow: '0 18px 40px rgba(233,30,99,0.22)',
                                opacity: scanning ? 0.7 : 1,
                            }}
                        >
                            {scanning ? 'Escaneando...' : 'Imprimir carnet'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Email />}
                            onClick={handleSendEmail}
                            disabled={scanning}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.15)',
                                color: 'common.white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            Enviar por correo
                        </Button>
                    </Stack>
                </Box>
            </Box>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScanMove {
                    0% { top: -2%; opacity: 0; }
                    5% { opacity: 1; }
                    85% { opacity: 1; }
                    95% { top: 100%; opacity: 0.6; }
                    100% { top: 102%; opacity: 0; }
                }
                @keyframes modalScanGlow {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes modalScanFlash {
                    0% { opacity: 0; transform: scale(0.92); }
                    40% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(1.04); }
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: landscape;
                        margin: 20mm;
                    }
                }
            `}</style>
        </>
    );
}
