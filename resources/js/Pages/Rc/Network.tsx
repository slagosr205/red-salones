import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { CheckCircle, Cancel, Badge as BadgeIcon, Search } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import type { RcRole } from '@/rc/role';
import type { MemberData } from '@/Pages/Rc/AffiliateCardModal';
import AffiliateCardModal from '@/Pages/Rc/AffiliateCardModal';

type NetworkRow = {
    id: number;
    name: string;
    email: string;
    role: 'Lider' | 'Salon';
    client_type: string | null;
    leader: string;
    leader_id: number | null;
    status: 'Activo' | 'Pendiente';
    created_at: string;
};

type Leader = { id: number; name: string; email: string };
type PendingUser = { id: number; name: string; email: string; client_type: string | null; created_at: string };

export default function NetworkPage() {
    const user = usePage().props.auth.user;
    const role: RcRole = user.role ?? 'salon';
    const dbUsers = (usePage().props as any).users as any[];
    const dbLeaders = (usePage().props as any).leaders as Leader[];
    const dbPending = (usePage().props as any).pending as PendingUser[];

    const canCreate = role === 'admin' || role === 'lider';
    const canApprove = role === 'admin' || role === 'lider';
    const isAdmin = role === 'admin';

    const [leaderDialog, setLeaderDialog] = useState<{ open: boolean; userId: number; currentLeaderId: number | null }>({
        open: false,
        userId: 0,
        currentLeaderId: null,
    });

    const [carnetUser, setCarnetUser] = useState<NetworkRow | null>(null);
    const [search, setSearch] = useState('');

    function scoreNetwork(query: string, r: NetworkRow): number {
        const q = query.trim().toLowerCase();
        if (!q) return 1;
        const name = r.name?.toLowerCase() ?? '';
        const email = r.email?.toLowerCase() ?? '';
        const role = r.role?.toLowerCase() ?? '';
        const leader = r.leader?.toLowerCase() ?? '';
        const status = r.status?.toLowerCase() ?? '';
        if (name === q || name.startsWith(q)) return 100;
        if (name.includes(q)) return 90;
        if (email.includes(q)) return 80;
        if (leader.includes(q)) return 70;
        if (role.includes(q)) return 60;
        if (status.includes(q)) return 50;
        return 0;
    }

    const rows: NetworkRow[] = useMemo(() => {
        if (!dbUsers || dbUsers.length === 0) return [];
        return dbUsers
            .map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role === 'lider' ? 'Lider' as const : 'Salon' as const,
                client_type: u.client_type ?? null,
                leader: u.leader ? u.leader.name : '-',
                leader_id: u.leader_id,
                status: u.status === 'active' ? 'Activo' as const : 'Pendiente' as const,
                created_at: u.created_at,
            }))
            .filter((r) => (search ? scoreNetwork(search, r) > 0 : true));
    }, [dbUsers, search]);

    const title = role === 'admin' ? 'Red Comercial' : role === 'lider' ? 'Mi Zona Comercial' : 'Red';

    const columns = useMemo<GridColDef<NetworkRow>[]>(
        () => [
            { field: 'name', headerName: 'Nombre', flex: 2, minWidth: 200 },
            { field: 'email', headerName: 'Email', flex: 2, minWidth: 200 },
            { field: 'role', headerName: 'Rol', flex: 1, minWidth: 100 },
            {
                field: 'client_type',
                headerName: 'Tipo Cliente',
                flex: 1,
                minWidth: 150,
                renderCell: (params) => {
                    if (params.row.role === 'Lider') return <Typography variant="body2" color="text.secondary">—</Typography>;
                    const label = params.value === 'consumidor_final' ? 'Consumidor Final' : 'Salón';
                    return (
                        <Chip size="small" label={label} color={params.value === 'consumidor_final' ? 'success' : 'primary'} variant="outlined" />
                    );
                },
            },
            {
                field: 'leader',
                headerName: 'Lider',
                flex: 1,
                minWidth: 160,
                renderCell: (params) => (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2">{params.value}</Typography>
                        {isAdmin && params.row.role === 'Salon' && (
                            <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                    setLeaderDialog({
                                        open: true,
                                        userId: params.row.id,
                                        currentLeaderId: params.row.leader_id,
                                    })
                                }
                            >
                                Cambiar
                            </Button>
                        )}
                    </Stack>
                ),
            },
            {
                field: 'status',
                headerName: 'Estado',
                flex: 1,
                minWidth: 120,
                renderCell: (params) => (
                    <Chip
                        size="small"
                        color={params.value === 'Activo' ? 'success' : 'warning'}
                        label={params.value}
                    />
                ),
            },
                    ...(canApprove
                ? [
                      {
                          field: 'actions' as const,
                          headerName: 'Acciones',
                          flex: 1,
                          minWidth: 200,
                          sortable: false,
                          renderCell: (params: { row: NetworkRow }) => (
                              <Stack direction="row" spacing={0.5}>
                                  {params.row.status === 'Pendiente' ? (
                                      <>
                                          <Button
                                              size="small"
                                              variant="contained"
                                              color="success"
                                              startIcon={<CheckCircle />}
                                              onClick={() => router.post(route('rc.approve', params.row.id))}
                                          >
                                              Aprobar
                                          </Button>
                                          <Button
                                              size="small"
                                              variant="outlined"
                                              color="error"
                                              startIcon={<Cancel />}
                                              onClick={() => {
                                                  if (confirm(`Rechazar a ${params.row.name}?`)) {
                                                      router.post(route('rc.reject', params.row.id));
                                                  }
                                              }}
                                          >
                                              Rechazar
                                          </Button>
                                      </>
                                   ) : params.row.role === 'Salon' && isAdmin ? (
                                      <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<BadgeIcon />}
                                          onClick={() => setCarnetUser(params.row)}
                                      >
                                          Carnet
                                      </Button>
                                  ) : null}
                              </Stack>
                          ),
                      } as GridColDef<NetworkRow>,
                  ]
                : []),
        ],
        [canApprove, isAdmin],
    );

    return (
        <AuthenticatedLayout header={title}>
            <Head title="Red Comercial" />

            <Stack spacing={3}>
                {canApprove && dbPending && dbPending.length > 0 && (
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                                Solicitudes pendientes ({dbPending.length})
                            </Typography>
                            <Stack spacing={1}>
                                {dbPending.map((u) => (
                                    <Stack
                                        key={u.id}
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 1,
                                            bgcolor: 'action.hover',
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {u.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {u.email} &middot; Solicitado:{' '}
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={0.5}>
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
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.25}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {dbUsers.length} usuarios registrados
                        </Typography>
                    </Stack>
                    {canCreate && (
                        <Button variant="contained" onClick={() => router.visit(route('rc.users.create'))}>
                            + Crear usuario
                        </Button>
                    )}
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por nombre, email, lider, estado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                            },
                        }}
                        sx={{ minWidth: 300 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {rows.length} de {dbUsers.length} usuarios
                    </Typography>
                </Stack>

                <Card>
                    <CardContent>
                        <Box sx={{ height: 520 }}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                getRowId={(r) => r.id}
                                disableRowSelectionOnClick
                                pageSizeOptions={[5, 10, 25]}
                                initialState={{
                                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Stack>

            {/* Leader assignment dialog */}
            {isAdmin && (
                <LeaderAssignDialog
                    open={leaderDialog.open}
                    userId={leaderDialog.userId}
                    currentLeaderId={leaderDialog.currentLeaderId}
                    leaders={dbLeaders ?? []}
                    onClose={() => setLeaderDialog({ open: false, userId: 0, currentLeaderId: null })}
                />
            )}

            {carnetUser && (
                <AffiliateCardModal
                    open={!!carnetUser}
                    onClose={() => setCarnetUser(null)}
                    user={carnetUser}
                />
            )}
        </AuthenticatedLayout>
    );
}

function LeaderAssignDialog({
    open,
    userId,
    currentLeaderId,
    leaders,
    onClose,
}: {
    open: boolean;
    userId: number;
    currentLeaderId: number | null;
    leaders: Leader[];
    onClose: () => void;
}) {
    const [selected, setSelected] = useState<Leader | null>(
        () => leaders.find((l) => l.id === currentLeaderId) ?? null,
    );

    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 1300,
                bgcolor: 'rgba(0,0,0,0.5)',
            }}
            onClick={onClose}
        >
            <Card
                sx={{ width: 380, p: 2 }}
                onClick={(e) => e.stopPropagation()}
            >
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Asignar lider
                    </Typography>
                    <Autocomplete
                        value={selected}
                        onChange={(_, v) => setSelected(v)}
                        options={leaders}
                        getOptionLabel={(o) => `${o.name} (${o.email})`}
                        renderInput={(params) => (
                            <TextField {...params} label="Lider" size="small" />
                        )}
                        fullWidth
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                router.post(
                                    route('rc.users.assign-leader', userId),
                                    { leader_id: selected?.id ?? null },
                                    { onSuccess: () => onClose() },
                                );
                            }}
                        >
                            Guardar
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
