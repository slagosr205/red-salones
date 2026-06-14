import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Divider,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { FormEventHandler, useState } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Iniciar sesion" />

            <Stack spacing={2}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.6 }}>
                        Iniciar sesion
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Accede a tu red comercial.
                    </Typography>
                </Box>

                {status && <Alert severity="success">{status}</Alert>}
                {(errors.email || errors.password) && (
                    <Alert severity="error">
                        Revisa tus credenciales e intenta de nuevo.
                    </Alert>
                )}

                <form onSubmit={submit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Correo"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            autoFocus
                            error={!!errors.email}
                            helperText={errors.email}
                            fullWidth
                            size="small"
                        />

                        <TextField
                            label="Contrasena"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            error={!!errors.password}
                            helperText={errors.password}
                            fullWidth
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? 'ocultar contrasena' : 'mostrar contrasena'}
                                            onClick={() => setShowPassword((v) => !v)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', (e.target.checked || false) as false)
                                        }
                                    />
                                }
                                label="Mantener sesion"
                            />
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: 'rgba(0,0,0,0.65)',
                                        textDecoration: 'none',
                                    }}
                                >
                                    Olvidaste tu contrasena?
                                </Link>
                            )}
                        </Stack>

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={processing}
                            sx={{
                                py: 1.25,
                                background:
                                    'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(156,39,176,1) 100%)',
                                boxShadow: '0 18px 40px rgba(233,30,99,0.22)',
                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 24px 55px rgba(233,30,99,0.26)',
                                },
                            }}
                        >
                            {processing ? 'Entrando…' : 'Entrar'}
                        </Button>
                    </Stack>
                </form>

                <Divider />

                <Typography variant="body2" color="text.secondary">
                    Eres un salon?{' '}
                    <Link href={route('register.request')} style={{ fontWeight: 900, color: '#E91E63' }}>
                        Solicita tu registro aqui
                    </Link>
                </Typography>
            </Stack>
        </GuestLayout>
    );
}
