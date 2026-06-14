import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';

function PlaceholderChart({ title }: { title: string }) {
    return (
        <Card>
            <CardContent>
                <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                <Box
                    sx={{
                        mt: 1.5,
                        height: 180,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundImage:
                            'linear-gradient(90deg, rgba(233,30,99,0.18), rgba(156,39,176,0.10))',
                    }}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Prototipo: graficos mock.
                </Typography>
            </CardContent>
        </Card>
    );
}

export default function ReportsPage() {
    return (
        <AuthenticatedLayout header="Reportes">
            <Head title="Reportes" />

            <Stack spacing={2.25}>
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={6}>
                        <PlaceholderChart title="Ventas por zona" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <PlaceholderChart title="Ventas por lider" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <PlaceholderChart title="Productos mas vendidos" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <PlaceholderChart title="Canjes y comisiones" />
                    </Grid>
                </Grid>

                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            Exportacion
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            En el sistema real: Excel y PDF.
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </AuthenticatedLayout>
    );
}
