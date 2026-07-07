<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\User;
use App\Services\TodoPagoClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $authUser = request()->user();
        $isAdmin = $authUser->role === User::ROLE_ADMIN;

        $orders = Order::query()
            ->with(['user:id,name,email', 'salon:id,name,email'])
            ->withCount('items')
            ->when(! $isAdmin, fn ($q) => $q->where('user_id', $authUser->id))
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Rc/Orders', [
            'orders' => $orders,
        ]);
    }

    public function show(int $id): Response
    {
        $order = Order::query()
            ->with(['user:id,name,email', 'salon:id,name,email', 'items'])
            ->findOrFail($id);

        $this->authorizeView($order);

        return Inertia::render('Rc/OrderDetail', [
            'order' => $order,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'salon_id' => ['nullable', 'exists:users,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_name' => ['required', 'string', 'max:255'],
            'items.*.product_id' => ['nullable', 'string', 'max:50'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount' => ['required', 'numeric', 'min:0'],
            'items.*.promo_type' => ['nullable', 'string', 'max:20'],
            'items.*.subtotal' => ['required', 'numeric', 'min:0'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'total_discount' => ['required', 'numeric', 'min:0'],
            'isv' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],
            'points_earned' => ['required', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'string', 'max:30'],
            'stripe_payment_intent_id' => ['nullable', 'string', 'max:255'],
            'todopago_transaccion_id' => ['nullable', 'string', 'max:50'],
            'todopago_response_code' => ['nullable', 'string', 'max:20'],
            'todopago_response_message' => ['nullable', 'string', 'max:255'],
            'todopago_card_number_masked' => ['nullable', 'string', 'max:20'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'string', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $authUser = $request->user();

        // Determine price tier based on client type
        $priceTier = 'price'; // default salon price
        if ($authUser->role === User::ROLE_LIDER && empty($validated['salon_id'])) {
            $priceTier = 'leader_price';
        } elseif (! empty($validated['salon_id'])) {
            $customer = User::query()->find($validated['salon_id']);
            if ($customer) {
                $priceTier = match ($customer->client_type) {
                    User::CLIENT_TYPE_CONSUMIDOR_FINAL => 'public_price',
                    default => 'price',
                };
            }
        }

        try {
            $order = DB::transaction(function () use ($validated, $authUser) {
                $year = now()->format('Y');
                $lastOrder = Order::query()
                    ->whereYear('created_at', $year)
                    ->lockForUpdate()
                    ->orderByDesc('id')
                    ->first();

                $nextId = $lastOrder ? $lastOrder->id + 1 : 1;

                $order = Order::query()->create([
                    'user_id' => $authUser->id,
                    'salon_id' => $validated['salon_id'] ?? null,
                    'order_number' => 'ORD-'.$year.'-'.str_pad((string) $nextId, 5, '0', STR_PAD_LEFT),
                    'status' => Order::STATUS_PACKAGING,
                    'subtotal' => $validated['subtotal'],
                    'total_discount' => $validated['total_discount'],
                    'isv' => $validated['isv'],
                    'grand_total' => $validated['grand_total'],
                    'points_earned' => $validated['points_earned'],
                    'payment_method' => $validated['payment_method'] ?? 'todopago',
                    'stripe_payment_intent_id' => $validated['stripe_payment_intent_id'] ?? null,
                    'todopago_transaccion_id' => $validated['todopago_transaccion_id'] ?? null,
                    'todopago_response_code' => $validated['todopago_response_code'] ?? null,
                    'todopago_response_message' => $validated['todopago_response_message'] ?? null,
                    'todopago_card_number_masked' => $validated['todopago_card_number_masked'] ?? null,
                    'customer_name' => $validated['customer_name'],
                    'customer_email' => $validated['customer_email'],
                    'notes' => $validated['notes'] ?? null,
                ]);

                $itemsData = array_map(fn ($item) => [
                    'order_id' => $order->id,
                    'product_name' => $item['product_name'],
                    'product_id' => $item['product_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'],
                    'promo_type' => $item['promo_type'] ?? null,
                    'subtotal' => $item['subtotal'],
                ], $validated['items']);

                $order->items()->createMany($itemsData);

                // Validate and deduct stock for each item
                foreach ($validated['items'] as $item) {
                    if (! empty($item['product_id'])) {
                        $articleId = (int) str_replace('art-', '', $item['product_id']);
                        $article = Article::query()->find($articleId);
                        if ($article && $article->stock !== null) {
                            if ($article->stock < $item['quantity']) {
                                throw new \RuntimeException(
                                    "Stock insuficiente para {$article->name}: disponible {$article->stock}, solicitado {$item['quantity']}"
                                );
                            }
                            $stockBefore = $article->stock;
                            $article->decrement('stock', $item['quantity']);
                            InventoryMovement::query()->create([
                                'article_id' => $article->id,
                                'type' => 'sale',
                                'quantity' => $item['quantity'],
                                'stock_before' => $stockBefore,
                                'stock_after' => $article->fresh()->stock,
                                'note' => 'Pedido #'.$order->order_number,
                            ]);
                        }
                    }
                }

                $authUser->increment('points_balance', $validated['points_earned']);

                return $order->load(['user:id,name,email', 'salon:id,name,email']);
            });

            return redirect()->route('rc.orders')
                ->with('success', 'Pedido #'.$order->order_number.' creado correctamente.');
        } catch (\RuntimeException $e) {
            return redirect()->back()
                ->with('error', $e->getMessage());
        }
    }

    public function updateStatus(Request $request, TodoPagoClient $todopago, int $id): RedirectResponse
    {
        $user = $request->user();
        $isAdmin = $user->role === User::ROLE_ADMIN;

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', Order::STATUSES)],
        ]);

        $order = Order::query()->findOrFail($id);
        $this->authorizeView($order);

        // Only admin can cancel orders
        if ($validated['status'] === Order::STATUS_CANCELLED && ! $isAdmin) {
            abort(403, 'Solo el administrador puede cancelar pedidos.');
        }

        // Only allow cancellation when order is still packaging
        if ($validated['status'] === Order::STATUS_CANCELLED && $order->status !== Order::STATUS_PACKAGING) {
            return redirect()->back()->with('error',
                'Solo se pueden cancelar pedidos con estado "en empaque".'
            );
        }

        // Only admin can modify shipping/transport flow
        if (! $isAdmin && in_array($validated['status'], [Order::STATUS_PACKAGING, Order::STATUS_IN_TRANSIT, Order::STATUS_DELIVERED])) {
            abort(403, 'No tienes permiso para modificar el flujo de transporte.');
        }

        // If cancelling an order with a TodoPago transaction, reverse it
        if ($validated['status'] === Order::STATUS_CANCELLED && $order->todopago_transaccion_id) {
            try {
                $revResp = $todopago->paymentReversal([
                    'transactionID' => (int) $order->todopago_transaccion_id,
                    'externalReference' => $order->order_number,
                ], 'json');

                $order->todopago_reversal_status = data_get($revResp, 'ok') ? 'reversed' : 'failed';
                $order->todopago_reversal_response = json_encode($revResp);
                $order->todopago_reversed_at = now();
                $order->save();
            } catch (\Throwable $e) {
                $order->todopago_reversal_status = 'error';
                $order->todopago_reversal_response = $e->getMessage();
                $order->todopago_reversed_at = now();
                $order->save();

                return redirect()->back()->with('error',
                    'Pedido cancelado pero falló la reversión en TodoPago: '.$e->getMessage()
                );
            }
        }

        $order->update(['status' => $validated['status']]);

        $label = match ($validated['status']) {
            Order::STATUS_PACKAGING => 'en empaque',
            Order::STATUS_IN_TRANSIT => 'en tránsito',
            Order::STATUS_DELIVERED => 'entregado',
            Order::STATUS_CANCELLED => 'cancelado',
            default => $validated['status'],
        };

        return redirect()->back()->with('success', "Pedido #{$order->order_number} marcado como {$label}.");
    }

    private function authorizeView(Order $order): void
    {
        $user = request()->user();
        $isAdmin = $user->role === User::ROLE_ADMIN;

        if (! $isAdmin && $order->user_id !== $user->id) {
            abort(403, 'No tienes permiso para ver este pedido.');
        }
    }
}
