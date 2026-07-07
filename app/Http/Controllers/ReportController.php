<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Redemption;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        $authUser = request()->user();
        $isAdmin = $authUser->role === User::ROLE_ADMIN;

        $ordersQuery = Order::query()->when(
            ! $isAdmin,
            fn ($q) => $q->where('user_id', $authUser->id)
        );

        $completedQuery = Order::query()
            ->whereIn('status', [Order::STATUS_DELIVERED, Order::STATUS_PACKAGING, Order::STATUS_IN_TRANSIT])
            ->when(! $isAdmin, fn ($q) => $q->where('user_id', $authUser->id));

        $totalOrders = (clone $ordersQuery)->count();
        $totalRevenue = (clone $completedQuery)->sum('grand_total');
        $totalPointsEarned = (clone $ordersQuery)->sum('points_earned');
        $totalRedemptions = Redemption::query()->count();

        $salesByLeader = (clone $ordersQuery)
            ->whereIn('orders.status', [Order::STATUS_DELIVERED, Order::STATUS_PACKAGING, Order::STATUS_IN_TRANSIT])
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->join('users as leaders', 'users.leader_id', '=', 'leaders.id')
            ->select('leaders.id', 'leaders.name', DB::raw('SUM(orders.grand_total) as total'), DB::raw('COUNT(orders.id) as count'))
            ->where('leaders.role', User::ROLE_LIDER)
            ->groupBy('leaders.id', 'leaders.name')
            ->orderByDesc('total')
            ->get();

        $salesByUser = (clone $ordersQuery)
            ->whereIn('orders.status', [Order::STATUS_DELIVERED, Order::STATUS_PACKAGING, Order::STATUS_IN_TRANSIT])
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->select('users.id', 'users.name', 'users.role', DB::raw('SUM(orders.grand_total) as total'), DB::raw('COUNT(orders.id) as count'))
            ->groupBy('users.id', 'users.name', 'users.role')
            ->orderByDesc('total')
            ->get();

        $topProducts = DB::table('articles')
            ->leftJoin('order_items', DB::raw('order_items.product_id'), '=', DB::raw("'art-' || articles.id"))
            ->leftJoin('orders', function ($join) use ($isAdmin, $authUser) {
                $join->on('order_items.order_id', '=', 'orders.id')
                    ->whereIn('orders.status', [Order::STATUS_DELIVERED, Order::STATUS_PACKAGING, Order::STATUS_IN_TRANSIT]);
                if (! $isAdmin) {
                    $join->where('orders.user_id', $authUser->id);
                }
            })
            ->select('articles.id', 'articles.name as product_name', DB::raw('COALESCE(SUM(order_items.quantity), 0) as total_qty'), DB::raw('COALESCE(SUM(order_items.subtotal), 0) as total_revenue'))
            ->groupBy('articles.id', 'articles.name')
            ->orderByDesc('total_qty')
            ->get();

        $monthlyRevenue = (clone $completedQuery)
            ->select(DB::raw("DATE_FORMAT(orders.created_at, '%Y-%m') as month"), DB::raw('SUM(orders.grand_total) as total'), DB::raw('COUNT(orders.id) as count'))
            ->groupBy(DB::raw("DATE_FORMAT(orders.created_at, '%Y-%m')"))
            ->orderBy('month')
            ->get();

        $ordersByStatus = (clone $ordersQuery)
            ->select('status', DB::raw('COUNT(id) as count'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('status')
            ->get();

        $recentOrders = (clone $ordersQuery)
            ->with(['user:id,name', 'salon:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'order_number', 'status', 'grand_total', 'customer_name', 'created_at']);

        return Inertia::render('Rc/Reports', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => (float) $totalRevenue,
                'totalPointsEarned' => $totalPointsEarned,
                'totalRedemptions' => $totalRedemptions,
            ],
            'salesByLeader' => $salesByLeader,
            'salesByUser' => $salesByUser,
            'topProducts' => $topProducts,
            'monthlyRevenue' => $monthlyRevenue,
            'ordersByStatus' => $ordersByStatus,
            'recentOrders' => $recentOrders,
        ]);
    }
}
