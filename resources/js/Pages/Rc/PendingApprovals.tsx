import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

type PendingUser = {
    id: number;
    name: string;
    email: string;
    leader_id: number | null;
    created_at: string;
};

export default function PendingApprovals() {
    const props = usePage().props as unknown as { pending: PendingUser[] };
    const { pending } = props;

    return (
        <AuthenticatedLayout header="Aprobaciones pendientes">
            <Head title="Aprobaciones pendientes" />

            <Box sx={{ maxWidth: 640 }}>
                {pending.length === 0 && (
                    <Typography color="text.secondary">No hay solicitudes pendientes.</Typography>
                )}

                <Stack spacing={1.5}>
                    {pending.map((u) => (
                        <Card key={u.id}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>{u.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Solicitado: {new Date(u.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircle />}
                                            onClick={() => router.post(route('rc.approve', u.id))}
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
