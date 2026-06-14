<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $authUser = request()->user();
        $role = $authUser->role;

        $data = match ($role) {
            User::ROLE_ADMIN => $this->adminData(),
            User::ROLE_LIDER => $this->liderData($authUser),
            default => $this->salonData($authUser),
        };

        return Inertia::render('Dashboard', $data);
    }

    private function adminData(): array
    {
        $totalUsers = User::query()->count();
        $totalAdmins = User::query()->where('role', User::ROLE_ADMIN)->count();
        $totalLideres = User::query()->where('role', User::ROLE_LIDER)->count();
        $totalSalones = User::query()->where('role', User::ROLE_SALON)->count();
        $activeUsers = User::query()->where('status', User::STATUS_ACTIVE)->count();
        $pendingUsers = User::query()->where('status', User::STATUS_PENDING)->count();
        $rejectedUsers = User::query()->where('status', User::STATUS_REJECTED)->count();
        $salonesActivos = User::query()->where('role', User::ROLE_SALON)->where('status', User::STATUS_ACTIVE)->count();
        $lideresActivos = User::query()->where('role', User::ROLE_LIDER)->where('status', User::STATUS_ACTIVE)->count();
        $salonesSinLider = User::query()->where('role', User::ROLE_SALON)->whereNull('leader_id')->count();

        $totalOrders = Order::query()->count();
        $pendingOrders = Order::query()->where('status', Order::STATUS_PACKAGING)->count();
        $recentOrders = Order::query()
            ->with(['user:id,name', 'salon:id,name'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'order_number', 'status', 'grand_total', 'customer_name', 'created_at'])
            ->toArray();

        $registrationsOverTime = User::query()
            ->select(DB::raw("strftime('%Y-%m', created_at) as month"), DB::raw('count(*) as total'))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => ['month' => $r->month, 'total' => (int) $r->total])
            ->values();

        $salonesPorLider = User::query()
            ->select('leader_id', DB::raw('count(*) as total'))
            ->where('role', User::ROLE_SALON)
            ->whereNotNull('leader_id')
            ->groupBy('leader_id')
            ->with('leader:id,name')
            ->get()
            ->map(fn ($r) => [
                'leader' => $r->leader?->name ?? 'Sin lider',
                'total' => (int) $r->total,
            ])
            ->values();

        $recentUsers = User::query()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'name', 'email', 'role', 'status', 'created_at'])
            ->toArray();

        $registrationsByDay = User::query()
            ->select(DB::raw("strftime('%Y-%m-%d', created_at) as date"), DB::raw('count(*) as total'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'total' => (int) $r->total])
            ->values();

        return [
            'role' => User::ROLE_ADMIN,
            'kpis' => [
                ['label' => 'Total usuarios', 'value' => (string) $totalUsers],
                ['label' => 'Salones activos', 'value' => (string) $salonesActivos],
                ['label' => 'Lideres activos', 'value' => (string) $lideresActivos],
                ['label' => 'Pendientes', 'value' => (string) $pendingUsers],
                ['label' => 'Pedidos totales', 'value' => (string) $totalOrders],
                ['label' => 'Pedidos pendientes', 'value' => (string) $pendingOrders],
            ],
            'charts' => [
                'roleDistribution' => [
                    ['name' => 'Administradores', 'value' => $totalAdmins],
                    ['name' => 'Lideres', 'value' => $totalLideres],
                    ['name' => 'Salones', 'value' => $totalSalones],
                ],
                'statusDistribution' => [
                    ['name' => 'Activos', 'value' => $activeUsers],
                    ['name' => 'Pendientes', 'value' => $pendingUsers],
                    ['name' => 'Rechazados', 'value' => $rejectedUsers],
                ],
                'registrationsOverTime' => $registrationsOverTime,
                'salonesPorLider' => $salonesPorLider,
                'registrationsByDay' => $registrationsByDay,
            ],
            'recentUsers' => $recentUsers,
            'recentOrders' => $recentOrders,
            'salonesSinLider' => $salonesSinLider,
        ];
    }

    private function liderData(User $lider): array
    {
        $salones = User::query()->where('leader_id', $lider->id);
        $totalSalones = (clone $salones)->count();
        $salonesActivos = (clone $salones)->where('status', User::STATUS_ACTIVE)->count();
        $salonesPendientes = (clone $salones)->where('status', User::STATUS_PENDING)->count();

        $recentSalones = (clone $salones)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'name', 'email', 'status', 'created_at'])
            ->toArray();

        $totalOrders = Order::query()->where('user_id', $lider->id)->count();
        $pendingOrders = Order::query()->where('user_id', $lider->id)->where('status', Order::STATUS_PACKAGING)->count();
        $recentOrders = Order::query()
            ->where('user_id', $lider->id)
            ->with(['user:id,name', 'salon:id,name'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'order_number', 'status', 'grand_total', 'customer_name', 'created_at'])
            ->toArray();

        return [
            'role' => User::ROLE_LIDER,
            'kpis' => [
                ['label' => 'Salones asignados', 'value' => (string) $totalSalones],
                ['label' => 'Salones activos', 'value' => (string) $salonesActivos],
                ['label' => 'Pendientes', 'value' => (string) $salonesPendientes],
                ['label' => 'Mis pedidos', 'value' => (string) $totalOrders],
                ['label' => 'Pedidos pendientes', 'value' => (string) $pendingOrders],
            ],
            'charts' => null,
            'recentUsers' => $recentSalones,
            'recentOrders' => $recentOrders,
            'salonesSinLider' => 0,
        ];
    }

    private function salonData(User $salon): array
    {
        $totalOrders = Order::query()->where('user_id', $salon->id)->count();
        $recentOrders = Order::query()
            ->where('user_id', $salon->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'order_number', 'status', 'grand_total', 'customer_name', 'created_at'])
            ->toArray();

        return [
            'role' => User::ROLE_SALON,
            'kpis' => [
                ['label' => 'Mi estado', 'value' => $salon->status === User::STATUS_ACTIVE ? 'Activo' : 'Pendiente'],
                ['label' => 'Mi lider', 'value' => $salon->leader?->name ?? 'Sin asignar'],
                ['label' => 'Mis pedidos', 'value' => (string) $totalOrders],
            ],
            'charts' => null,
            'recentUsers' => [],
            'recentOrders' => $recentOrders,
            'salonesSinLider' => 0,
        ];
    }
}
