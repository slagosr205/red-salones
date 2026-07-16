<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\BenefitController;
use App\Http\Controllers\BulkUploadController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TodoPagoController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\ZoneController;
use App\Models\Article;
use App\Models\Order;
use App\Models\Redemption;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/storage/{path}', function (string $path) {
    $fullPath = realpath(storage_path('app/public/'.$path));
    $storageDir = realpath(storage_path('app/public'));

    if (! $fullPath || ! str_starts_with($fullPath, $storageDir) || ! file_exists($fullPath) || is_dir($fullPath)) {
        abort(404);
    }

    return response()->file($fullPath, [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

Route::get('/favicon.ico', function () {
    $file = realpath(storage_path('app/public/logo.png'));
    if (! $file || ! file_exists($file)) {
        abort(404);
    }

    return response()->file($file, [
        'Content-Type' => 'image/x-icon',
        'Cache-Control' => 'public, max-age=86400',
    ]);
});

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Public featured articles API
Route::get('/api/articulos-destacados', [ArticleController::class, 'featured'])->name('api.articles.featured');
Route::get('/api/catalogo-articulos', [ArticleController::class, 'catalog'])->name('api.articles.catalog');
Route::get('/api/promociones-activas', [PromotionController::class, 'activePromotions'])->name('api.promotions.active');
Route::get('/api/promociones-activas-con-productos', [PromotionController::class, 'activeWithProducts'])->name('api.promotions.active-with-products');

// Public benefits API
Route::get('/api/beneficios', [BenefitController::class, 'index'])->name('api.benefits.index');

// Authenticated redeem API
Route::middleware(['auth'])->post('/api/beneficios/canjear', [BenefitController::class, 'redeem'])->name('api.benefits.redeem');

// TodoPago (diagnostico)
Route::middleware(['auth'])->get('/api/todopago/health', [TodoPagoController::class, 'health'])->name('api.todopago.health');
Route::middleware(['auth'])->post('/api/todopago/login', [TodoPagoController::class, 'login'])->name('api.todopago.login');
Route::middleware(['auth'])->post('/api/todopago/pay', [TodoPagoController::class, 'pay'])->name('api.todopago.pay');
Route::middleware(['auth'])->get('/api/todopago/accounts', [TodoPagoController::class, 'accounts'])->name('api.todopago.accounts');
Route::middleware(['auth'])->post('/api/todopago/customer-register', [TodoPagoController::class, 'customerRegister'])->name('api.todopago.customer-register');
Route::middleware(['auth'])->post('/api/todopago/account-register', [TodoPagoController::class, 'accountRegister'])->name('api.todopago.account-register');
Route::middleware(['auth'])->post('/api/todopago/direct-payment', [TodoPagoController::class, 'directPayment'])->name('api.todopago.direct-payment');
Route::middleware(['auth'])->post('/api/todopago/payment-reversal', [TodoPagoController::class, 'reversal'])->name('api.todopago.payment-reversal');

// Admin benefits CRUD API
Route::middleware(['auth'])->prefix('api/beneficios/admin')->name('api.benefits.')->group(function () {
    Route::get('/', [BenefitController::class, 'adminIndex'])->name('admin-index');
    Route::post('/', [BenefitController::class, 'store'])->name('store');
    Route::match(['put', 'patch'], '/{benefit}', [BenefitController::class, 'update'])->name('update');
    Route::delete('/{benefit}', [BenefitController::class, 'destroy'])->name('destroy');
    Route::post('/{benefit}/toggle', [BenefitController::class, 'toggle'])->name('toggle');
});

// Admin promotions CRUD API
Route::middleware(['auth'])->prefix('api/promociones')->name('api.promotions.')->group(function () {
    Route::get('/', [PromotionController::class, 'index'])->name('index');
    Route::post('/', [PromotionController::class, 'store'])->name('store');
    Route::match(['put', 'patch'], '/{promotion}', [PromotionController::class, 'update'])->name('update');
    Route::delete('/{promotion}', [PromotionController::class, 'destroy'])->name('destroy');
    Route::post('/{promotion}/toggle', [PromotionController::class, 'toggle'])->name('toggle');
});

// Inventory API
Route::middleware(['auth'])->prefix('api/inventario')->name('api.inventory.')->group(function () {
    Route::get('/', [InventoryController::class, 'index'])->name('index');
    Route::get('/movimientos', [InventoryController::class, 'movements'])->name('movements');
    Route::post('/entrada', [InventoryController::class, 'entry'])->name('entry');
    Route::post('/min-stock', [InventoryController::class, 'setMinStock'])->name('min-stock');
});

// Public storefront (clients can browse and build a cart without login).
Route::get('/catalogo', fn () => Inertia::render('Public/Catalog'))->name('shop.catalog');
Route::get('/carrito', fn () => Inertia::render('Public/Cart'))->name('shop.cart');

// Public affiliate card preview (no auth required)
Route::get('/carnet', fn () => Inertia::render('Public/AffiliateCard'))->name('carnet');

// Video tutorials for end users (no auth required)
Route::get('/tutoriales', fn () => Inertia::render('Public/Tutorials'))->name('tutorials');

// Public salon registration request
Route::get('/solicitar-registro', [RegistrationController::class, 'create'])->name('register.request');
Route::post('/solicitar-registro', [RegistrationController::class, 'store'])->name('register.request.store');

// Membership info and payment
Route::get('/api/membresia', [RegistrationController::class, 'membershipInfo'])->name('api.membership.info');
Route::post('/api/membresia/pagar', [RegistrationController::class, 'payMembership'])->name('api.membership.pay');

// Registration success page (shown after self-registration)
Route::get('/registro-exitoso', fn () => Inertia::render('Public/RegistrationSuccess'))->name('register.success');

// Pending approval waiting page
Route::get('/cuenta-pendiente', fn () => Inertia::render('Public/PendingWaiting'))
    ->middleware(['auth'])
    ->name('pending.waiting');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

Route::middleware(['auth'])->prefix('rc')->name('rc.')->group(function () {
    Route::get('/productos', fn () => Inertia::render('Rc/Products'))->name('products');
    Route::get('/pos', function () {
        $authUser = request()->user();
        $isAdmin = $authUser->role === User::ROLE_ADMIN;

        $customers = User::query()
            ->whereIn('role', [User::ROLE_LIDER, User::ROLE_SALON])
            ->where('status', User::STATUS_ACTIVE)
            ->where('id', '!=', $authUser->id)
            ->when(! $isAdmin, function ($q) use ($authUser) {
                $q->where('leader_id', $authUser->id);
            })
            ->with('leader:id,name,email,role')
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'leader_id', 'client_type']);

        return Inertia::render('Rc/Pos', [
            'customers' => $customers,
        ]);
    })->name('pos');
    Route::get('/carrito', function () {
        $authUser = request()->user();
        $isAdmin = $authUser->role === User::ROLE_ADMIN;

        $customers = User::query()
            ->whereIn('role', [User::ROLE_LIDER, User::ROLE_SALON])
            ->where('status', User::STATUS_ACTIVE)
            ->where('id', '!=', $authUser->id)
            ->when(! $isAdmin, function ($q) use ($authUser) {
                $q->where('leader_id', $authUser->id);
            })
            ->get(['id', 'name', 'email', 'role', 'client_type']);

        return Inertia::render('Rc/Cart', [
            'customers' => $customers,
        ]);
    })->name('cart');
    Route::get('/puntos', function () {
        $user = request()->user();

        $totalEarned = (int) Order::query()->where('user_id', $user->id)->sum('points_earned');
        $totalRedeemed = (int) Redemption::query()->where('user_id', $user->id)->sum('points_cost');

        $recentRedemptions = Redemption::query()
            ->where('user_id', $user->id)
            ->with('benefit:id,title')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'id' => 'red-'.$r->id,
                'date' => $r->created_at->format('Y-m-d'),
                'type' => 'Canje',
                'points' => -$r->points_cost,
                'description' => 'Canje: '.($r->benefit?->title ?? 'Beneficio'),
            ]);

        $recentOrders = Order::query()
            ->where('user_id', $user->id)
            ->where('points_earned', '>', 0)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($o) => [
                'id' => 'ord-'.$o->id,
                'date' => $o->created_at->format('Y-m-d'),
                'type' => 'Compra',
                'points' => (int) $o->points_earned,
                'description' => 'Compra: '.($o->order_number ?? 'Pedido #'.$o->id),
            ]);

        $history = collect([...$recentRedemptions, ...$recentOrders])
            ->sortByDesc('date')
            ->values()
            ->all();

        return Inertia::render('Rc/Points', [
            'pointsBalance' => (int) $user->points_balance,
            'totalEarned' => $totalEarned,
            'totalRedeemed' => $totalRedeemed,
            'history' => $history,
        ]);
    })->name('points');
    Route::get('/canjes', fn () => Inertia::render('Rc/Redeem'))->name('redeem');
    Route::get('/master-classes', fn () => Inertia::render('Rc/MasterClasses'))->name('masterclasses');
    Route::get('/inventario', function () {
        $items = Article::query()->orderBy('name')->get()->map(fn ($a) => [
            'id' => 'art-'.$a->id,
            'name' => $a->name,
            'brand' => $a->brand ?? '',
            'category' => $a->category ?? '',
            'price' => (float) ($a->price ?? 0),
            'stock' => $a->stock ?? 0,
            'minStock' => $a->min_stock ?? 0,
        ]);

        return Inertia::render('Rc/Inventory', ['items' => $items]);
    })->name('inventory');
    Route::get('/promociones', fn () => Inertia::render('Rc/Promotions'))->name('promotions');
    Route::get('/beneficios', fn () => Inertia::render('Rc/Benefits'))->name('benefits');
    Route::get('/reportes', [ReportController::class, 'index'])->name('reports');
    Route::get('/red-comercial', function () {
        $authUser = request()->user();
        $isAdmin = $authUser->role === User::ROLE_ADMIN;
        $isLider = $authUser->role === User::ROLE_LIDER;

        $canApprove = $isAdmin || $isLider;

        $users = User::query()
            ->whereIn('role', [User::ROLE_LIDER, User::ROLE_SALON])
            ->when(! $isAdmin, fn ($q) => $q->where('leader_id', $authUser->id))
            ->with('leader:id,name,email')
            ->with('zones:id,name')
            ->orderBy('status')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'leader_id', 'status', 'client_type', 'created_at']);

        $leaders = $isAdmin
            ? User::query()->where('role', User::ROLE_LIDER)->where('status', User::STATUS_ACTIVE)
                ->with('zones:id,name')
                ->get(['id', 'name', 'email'])
            : collect();

        $pending = $canApprove
            ? User::query()->where('status', User::STATUS_PENDING)->where('role', User::ROLE_SALON)
                ->when($isLider, fn ($q) => $q->where('leader_id', $authUser->id))
                ->get(['id', 'name', 'email', 'client_type', 'created_at'])
            : collect();

        $allZones = $isAdmin
            ? Zone::query()->orderBy('name')->get(['id', 'name'])
            : collect();

        return Inertia::render('Rc/Network', [
            'users' => $users,
            'leaders' => $leaders,
            'pending' => $pending,
            'allZones' => $allZones,
        ]);
    })->name('network');

    Route::get('/usuarios/crear', [UserManagementController::class, 'create'])->name('users.create');
    Route::post('/usuarios', [UserManagementController::class, 'store'])->name('users.store');
    Route::post('/usuarios/{id}/asignar-lider', [UserManagementController::class, 'assignLeader'])->name('users.assign-leader');
    Route::get('/usuarios/{id}/carnet', [UserManagementController::class, 'showCarnet'])->name('users.carnet');
    Route::post('/usuarios/{id}/carnet/enviar', [UserManagementController::class, 'sendCarnet'])->name('users.carnet.send');

    Route::get('/pendientes', [RegistrationController::class, 'pending'])->name('pending');
    Route::post('/pendientes/{id}/aprobar', [RegistrationController::class, 'approve'])->name('approve');
    Route::post('/pendientes/{id}/rechazar', [RegistrationController::class, 'reject'])->name('reject');

    Route::get('/configuracion', fn () => Inertia::render('Rc/Settings'))->name('settings');
    Route::get('/api/configuracion', [SettingsController::class, 'index'])->name('api.settings.index');
    Route::put('/api/configuracion', [SettingsController::class, 'update'])->name('api.settings.update');

    Route::get('/articulos', [ArticleController::class, 'index'])->name('articles');
    Route::get('/articulos/crear', [ArticleController::class, 'create'])->name('articles.create');
    Route::post('/articulos', [ArticleController::class, 'store'])->name('articles.store');
    Route::get('/articulos/{id}/editar', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::match(['patch', 'post'], '/articulos/{id}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('/articulos/{id}', [ArticleController::class, 'destroy'])->name('articles.destroy');
    Route::post('/articulos/{id}/toggle-featured', [ArticleController::class, 'toggleFeatured'])->name('articles.toggle-featured');
    Route::post('/articulos/{id}/imagen', [ArticleController::class, 'updateImage'])->name('articles.update-image');

    Route::get('/carga-masiva', fn () => Inertia::render('Rc/BulkUpload'))->name('bulk-upload');
    Route::get('/carga-masiva/plantilla', [BulkUploadController::class, 'downloadTemplate'])->name('bulk-upload.template');
    Route::post('/carga-masiva/articulos', [BulkUploadController::class, 'uploadArticles'])->name('bulk-upload.articles');
    Route::post('/carga-masiva/stock', [BulkUploadController::class, 'uploadStock'])->name('bulk-upload.stock');

    Route::get('/pedidos', [OrderController::class, 'index'])->name('orders');
    Route::get('/pedidos/{id}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/pedidos', [OrderController::class, 'store'])->name('orders.store');
    Route::patch('/pedidos/{id}/estado', [OrderController::class, 'updateStatus'])->name('orders.status');

    Route::post('/imprimir-recibo', [PrintController::class, 'printReceipt'])->name('print.receipt');
    Route::post('/crear-payment', [PaymentController::class, 'createPaymentIntent'])->name('create-payment');

    Route::get('/zonas', [ZoneController::class, 'index'])->name('zones.index');
    Route::post('/zonas', [ZoneController::class, 'store'])->name('zones.store');
    Route::match(['patch', 'post'], '/zonas/{id}', [ZoneController::class, 'update'])->name('zones.update');
    Route::delete('/zonas/{id}', [ZoneController::class, 'destroy'])->name('zones.destroy');
    Route::post('/zonas/{id}/asignar-lideres', [ZoneController::class, 'assignLeaders'])->name('zones.assign-leaders');

    Route::post('/migrar', function () {
        if (request()->user()->role !== User::ROLE_ADMIN) {
            abort(403, 'Solo el administrador puede ejecutar migraciones.');
        }

        try {
            Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();

            return response()->json([
                'ok' => true,
                'output' => $output,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    })->name('migrate');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
