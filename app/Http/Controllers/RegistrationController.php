<?php

namespace App\Http\Controllers;

use App\Mail\PendingApproval;
use App\Models\Article;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Public/RegisterRequest');
    }

    public function membershipInfo(): JsonResponse
    {
        $price = $this->getEffectiveMembershipPrice();
        $kitIds = Setting::get('welcome_kit_articles', []);

        $articles = [];
        if (! empty($kitIds)) {
            $articles = Article::whereIn('id', $kitIds)
                ->get(['id', 'name', 'brand', 'price', 'image_path'])
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'brand' => $a->brand,
                    'price' => $a->price,
                    'image' => $a->image_path ? "/storage/{$a->image_path}" : null,
                ])
                ->toArray();
        }

        return response()->json([
            'price' => $price,
            'articles' => $articles,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
        ]);

        $plainPassword = Str::random(10);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($plainPassword),
            'role' => User::ROLE_SALON,
            'status' => 'pending',
        ]);

        Mail::to($user->email)->send(new PendingApproval($user, $plainPassword));

        return response()->json([
            'success' => true,
            'message' => 'Registro exitoso. Revisa tu correo para las credenciales.',
        ]);
    }

    public function payMembership(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'payment_method' => ['required', 'string', 'in:efectivo,tc,td'],
        ]);

        $membershipPrice = $this->getEffectiveMembershipPrice();
        $kitIds = Setting::get('welcome_kit_articles', []);

        $plainPassword = Str::random(10);

        $order = DB::transaction(function () use ($validated, $plainPassword, $membershipPrice, $kitIds) {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($plainPassword),
                'role' => User::ROLE_SALON,
                'status' => 'pending',
            ]);

            $orderNumber = $this->generateOrderNumber();

            $articles = [];
            if (! empty($kitIds)) {
                $articles = Article::whereIn('id', $kitIds)->get();
            }

            $kitTotal = $articles->sum('price');

            $subtotal = $membershipPrice;
            $taxable = $subtotal;
            $isv = $taxable * 0.15;
            $grandTotal = $taxable + $isv;

            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'delivered',
                'subtotal' => $subtotal,
                'total_discount' => 0,
                'isv' => $isv,
                'grand_total' => $grandTotal,
                'points_earned' => 0,
                'payment_method' => $validated['payment_method'],
                'customer_name' => $user->name,
                'customer_email' => $user->email,
                'notes' => 'Membresia — Kit de bienvenida incluido',
            ]);

            $orderItems = [];

            $orderItems[] = [
                'product_name' => 'Membresia Red Pro Beauty',
                'product_id' => null,
                'quantity' => 1,
                'unit_price' => $membershipPrice,
                'discount' => 0,
                'promo_type' => null,
                'subtotal' => $membershipPrice,
            ];

            foreach ($articles as $article) {
                $orderItems[] = [
                    'product_name' => $article->name.' (Kit de bienvenida)',
                    'product_id' => 'art-'.$article->id,
                    'quantity' => 1,
                    'unit_price' => $article->price ?? 0,
                    'discount' => 0,
                    'promo_type' => null,
                    'subtotal' => $article->price ?? 0,
                ];
            }

            OrderItem::insert($orderItems);

            return ['user' => $user, 'order' => $order, 'plainPassword' => $plainPassword];
        });

        Mail::to($validated['email'])->send(new PendingApproval($order['user'], $order['plainPassword']));

        return response()->json([
            'success' => true,
            'order_number' => $order['order']->order_number,
            'message' => 'Membresia pagada. Pedido creado. Revisa tu correo para las credenciales.',
        ]);
    }

    public function pending(): Response
    {
        $this->authorizeApprover();

        $pending = User::query()
            ->where('status', 'pending')
            ->where('role', User::ROLE_SALON)
            ->with('leader:id,name')
            ->withCount('orders')
            ->get(['id', 'name', 'email', 'leader_id', 'created_at']);

        return Inertia::render('Rc/PendingApprovals', [
            'pending' => $pending,
            'membershipPrice' => $this->getEffectiveMembershipPrice(),
        ]);
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        $this->authorizeApprover();

        $user = User::query()->findOrFail($id);

        if ($user->role === User::ROLE_SALON) {
            $validated = $request->validate([
                'client_type' => ['required', 'string', 'in:'.implode(',', User::CLIENT_TYPES)],
                'payment_method' => ['required', 'string', 'in:efectivo,tc,td'],
            ]);

            DB::transaction(function () use ($user, $validated) {
                $user->update([
                    'status' => User::STATUS_ACTIVE,
                    'client_type' => $validated['client_type'],
                ]);

                $hasOrder = Order::where('user_id', $user->id)->exists();

                if (! $hasOrder) {
                    $membershipPrice = $this->getEffectiveMembershipPrice();
                    $kitIds = Setting::get('welcome_kit_articles', []);

                    $orderNumber = $this->generateOrderNumber();

                    $articles = [];
                    if (! empty($kitIds)) {
                        $articles = Article::whereIn('id', $kitIds)->get();
                    }

                    $subtotal = $membershipPrice;
                    $isv = $subtotal * 0.15;
                    $grandTotal = $subtotal + $isv;

                    $order = Order::create([
                        'user_id' => $user->id,
                        'order_number' => $orderNumber,
                        'status' => 'delivered',
                        'subtotal' => $subtotal,
                        'total_discount' => 0,
                        'isv' => $isv,
                        'grand_total' => $grandTotal,
                        'points_earned' => 0,
                        'payment_method' => $validated['payment_method'],
                        'customer_name' => $user->name,
                        'customer_email' => $user->email,
                        'notes' => 'Membresia — Kit de bienvenida incluido',
                    ]);

                    $orderItems = [];

                    $orderItems[] = [
                        'order_id' => $order->id,
                        'product_name' => 'Membresia Red Pro Beauty',
                        'product_id' => null,
                        'quantity' => 1,
                        'unit_price' => $membershipPrice,
                        'discount' => 0,
                        'promo_type' => null,
                        'subtotal' => $membershipPrice,
                    ];

                    foreach ($articles as $article) {
                        $orderItems[] = [
                            'order_id' => $order->id,
                            'product_name' => $article->name.' (Kit de bienvenida)',
                            'product_id' => 'art-'.$article->id,
                            'quantity' => 1,
                            'unit_price' => $article->price ?? 0,
                            'discount' => 0,
                            'promo_type' => null,
                            'subtotal' => $article->price ?? 0,
                        ];
                    }

                    OrderItem::insert($orderItems);
                }
            });
        } elseif ($user->role === User::ROLE_LIDER) {
            $user->update([
                'status' => User::STATUS_ACTIVE,
            ]);
        } else {
            abort(422, 'Rol de usuario no soportado para aprobacion.');
        }

        return redirect()->back()->with('success', "Usuario {$user->name} aprobado correctamente.");
    }

    public function reject(int $id): RedirectResponse
    {
        $this->authorizeApprover();

        $user = User::query()->findOrFail($id);
        $user->delete();

        return redirect()->back()->with('success', 'Solicitud rechazada y eliminada.');
    }

    private function generateOrderNumber(): string
    {
        $year = date('Y');
        $lastOrder = Order::query()
            ->where('order_number', 'like', "ORD-{$year}-%")
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('order_number');

        if ($lastOrder && preg_match('/ORD-\d{4}-(\d{5})/', $lastOrder, $m)) {
            $seq = (int) $m[1] + 1;
        } else {
            $seq = 1;
        }

        return sprintf('ORD-%s-%05d', $year, $seq);
    }

    private function authorizeApprover(): void
    {
        $role = request()->user()->role ?? '';
        abort_unless($role === User::ROLE_ADMIN || $role === User::ROLE_LIDER, 403);
    }

    private function getEffectiveMembershipPrice(): float
    {
        $basePrice = (float) Setting::get('membership_price', 0);

        $discountPrice = Setting::get('membership_discount_price');
        $discountFrom = Setting::get('membership_discount_from');
        $discountUntil = Setting::get('membership_discount_until');

        if ($discountPrice !== null && $discountFrom !== null && $discountUntil !== null) {
            $now = now()->toDateString();
            if ($now >= $discountFrom && $now <= $discountUntil) {
                return (float) $discountPrice;
            }
        }

        return $basePrice;
    }
}
