import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import type { RcRole } from '@/rc/role';

type LeaderOption = { id: number; name: string; email: string };

export default function CreateUser() {
    const user = usePage().props.auth.user;
    const userRole: RcRole = user.role ?? 'salon';
    const leaders = (usePage().props as any).leaders as LeaderOption[];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<string>('salon');
    const [clientType, setClientType] = useState<string>('salon');
    const [leaderId, setLeaderId] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);

    const isAdmin = userRole === 'admin';
    const isCreatingLider = isAdmin && role === 'lider';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload: Record<string, unknown> = {
            name,
            email,
            password,
            leader_id: leaderId || undefined,
        };
        if (isAdmin) {
            payload.role = role;
            if (!isCreatingLider) {
                payload.client_type = clientType;
            }
        }
        router.post(route('rc.users.store'), payload as any, {
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AuthenticatedLayout header="Crear Usuario">
            <Head title="Crear Usuario" />

            <Box sx={{ maxWidth: 520 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                            {isCreatingLider ? 'Nuevo lider' : 'Nuevo usuario de salon'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                            {isCreatingLider
                                ? 'Crea un lider. Quedara activo inmediatamente.'
                                : isAdmin
                                    ? 'Crea un usuario de salon. Quedara pendiente de aprobacion. Asigna al lider correspondiente.'
                                    : 'Crea un usuario de salon. Quedara asignado a tu zona, pendiente de aprobacion.'}
                        </Typography>

                        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                            {isAdmin && (
                                <FormControl size="small">
                                    <InputLabel>Tipo de usuario</InputLabel>
                                    <Select
                                        value={role}
                                        label="Tipo de usuario"
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <MenuItem value="salon">Salon</MenuItem>
                                        <MenuItem value="lider">Lider</MenuItem>
                                    </Select>
                                </FormControl>
                            )}

                            {isAdmin && !isCreatingLider && (
                                <FormControl size="small">
                                    <InputLabel>Tipo de cliente</InputLabel>
                                    <Select
                                        value={clientType}
                                        label="Tipo de cliente"
                                        onChange={(e) => setClientType(e.target.value)}
                                    >
                                        <MenuItem value="salon">Salón</MenuItem>
                                        <MenuItem value="consumidor_final">Consumidor Final</MenuItem>
                                    </Select>
                                </FormControl>
                            )}

                            <TextField
                                required
                                size="small"
                                label="Nombre"
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
                            <TextField
                                required
                                size="small"
                                label="Contrasena"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                helperText="Minimo 8 caracteres"
                            />

                            {isAdmin && !isCreatingLider && (
                                <FormControl size="small">
                                    <InputLabel>Lider asignado</InputLabel>
                                    <Select
                                        value={leaderId}
                                        label="Lider asignado"
                                        onChange={(e) => setLeaderId(e.target.value as number)}
                                    >
                                        <MenuItem value="">Seleccionar lider...</MenuItem>
                                        {leaders.map((l) => (
                                            <MenuItem key={l.id} value={l.id}>
                                                {l.name} ({l.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Creando...' : 'Crear usuario'}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </AuthenticatedLayout>
    );
}
