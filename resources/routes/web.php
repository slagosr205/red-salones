<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\BenefitController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserManagementController;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

// Public benefits API
Route::get('/api/beneficios', [BenefitController::class, 'index'])->name('api.benefits.index');

// Authenticated redeem API
Route::middleware(['auth'])->post('/api/beneficios/canjear', [BenefitController::class, 'redeem'])->name('api.benefits.redeem');

// Admin promotions CRUD API
Route::middleware(['auth'])->prefix('api/promociones')->name('api.promotions.')->group(function () {
    Route::get('/', [PromotionController::class, 'index'])->name('index');
    Route::post('/', [PromotionController::class, 'store'])->name('store');
    Route::match(['put', 'patch'], '/{promotion}', [PromotionController::class, 'update'])->name('update');
    Route::delete('/{promotion}', [PromotionController::class, 'destroy'])->name('destroy');
    Route::post('/{promotion}/toggle', [PromotionController::class, 'toggle'])->name('toggle');
});

// Public storefront (clients can browse and build a cart without login).
Route::get('/catalogo', fn () => Inertia::render('Public/Catalog'))->name('shop.catalog');
Route::get('/carrito', fn () => Inertia::render('Public/Cart'))->name('shop.cart');

// Public affiliate card preview (no auth required)
Route::get('/carnet', fn () => Inertia::render('Public/AffiliateCard'))->name('carnet');

// Public salon registration request
Route::get('/solicitar-registro', [RegistrationController::class, 'create'])->name('register.request');
Route::post('/solicitar-registro', [RegistrationController::class, 'store'])->name('register.request.store');

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
        $customers = User::query()
            ->whereIn('role', [User::ROLE_LIDER, User::ROLE_SALON])
            ->where('status', User::STATUS_ACTIVE)
            ->with('leader:id,name,email,role')
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'leader_id']);

        return Inertia::render('Rc/Pos', [
            'customers' => $customers,
        ]);
    })->name('pos');
    Route::get('/carrito', fn () => Inertia::render('Rc/Cart'))->name('cart');
    Route::get('/puntos', fn () => Inertia::render('Rc/Points'))->name('points');
    Route::get('/canjes', fn () => Inertia::render('Rc/Redeem'))->name('redeem');
    Route::get('/master-classes', fn () => Inertia::render('Rc/MasterClasses'))->name('masterclasses');
    Route::get('/inventario', fn () => Inertia::render('Rc/Inventory'))->name('inventory');
    Route::get('/promociones', fn () => Inertia::render('Rc/Promotions'))->name('promotions');
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
            ->orderBy('status')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'leader_id', 'status', 'created_at']);

        $leaders = $isAdmin
            ? User::query()->where('role', User::ROLE_LIDER)->where('status', User::STATUS_ACTIVE)->get(['id', 'name', 'email'])
            : collect();

        $pending = $canApprove
            ? User::query()->where('status', User::STATUS_PENDING)->where('role', User::ROLE_SALON)
                ->when($isLider, fn ($q) => $q->where('leader_id', $authUser->id))
                ->get(['id', 'name', 'email', 'created_at'])
            : collect();

        return Inertia::render('Rc/Network', [
            'users' => $users,
            'leaders' => $leaders,
            'pending' => $pending,
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

    Route::get('/articulos', [ArticleController::class, 'index'])->name('articles');
    Route::get('/articulos/crear', [ArticleController::class, 'create'])->name('articles.create');
    Route::post('/articulos', [ArticleController::class, 'store'])->name('articles.store');
    Route::get('/articulos/{id}/editar', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::match(['patch', 'post'], '/articulos/{id}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('/articulos/{id}', [ArticleController::class, 'destroy'])->name('articles.destroy');
    Route::post('/articulos/{id}/toggle-featured', [ArticleController::class, 'toggleFeatured'])->name('articles.toggle-featured');

    Route::get('/pedidos', [OrderController::class, 'index'])->name('orders');
    Route::get('/pedidos/{id}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/pedidos', [OrderController::class, 'store'])->name('orders.store');
    Route::patch('/pedidos/{id}/estado', [OrderController::class, 'updateStatus'])->name('orders.status');

    Route::post('/imprimir-recibo', [PrintController::class, 'printReceipt'])->name('print.receipt');
    Route::post('/crear-payment', [PaymentController::class, 'createPaymentIntent'])->name('create-payment');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
