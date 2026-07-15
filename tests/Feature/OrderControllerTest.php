<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Order;
use App\Models\User;
use App\Services\TodoPagoClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private User $salon;

    private Article $article;

    private array $validPayload;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => User::ROLE_LIDER,
            'points_balance' => 0,
        ]);

        $this->salon = User::factory()->create([
            'role' => User::ROLE_SALON,
            'client_type' => User::CLIENT_TYPE_SALON,
        ]);

        $this->article = Article::create([
            'name' => 'Test Product',
            'stock' => 10,
            'price' => 100.00,
            'created_by' => $this->user->id,
        ]);

        $this->validPayload = [
            'salon_id' => $this->salon->id,
            'items' => [
                [
                    'product_name' => 'Test Product',
                    'product_id' => 'art-'.$this->article->id,
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'discount' => 0,
                    'promo_type' => null,
                    'subtotal' => 200.00,
                ],
            ],
            'subtotal' => 200.00,
            'total_discount' => 0,
            'isv' => 30.00,
            'grand_total' => 230.00,
            'points_earned' => 10,
            'payment_method' => 'todopago',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
        ];
    }

    public function test_guest_cannot_create_order(): void
    {
        $this->postJson('/rc/pedidos', $this->validPayload)
            ->assertUnauthorized();
    }

    public function test_creates_order_successfully_via_ajax(): void
    {
        $this->mock(TodoPagoClient::class);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $this->validPayload);

        $response->assertOk()
            ->assertJson([
                'ok' => true,
                'message' => 'Pedido #ORD-'.now()->format('Y').'-00001 creado correctamente.',
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'salon_id' => $this->salon->id,
            'grand_total' => 230.00,
            'status' => Order::STATUS_PACKAGING,
            'customer_email' => 'john@example.com',
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_name' => 'Test Product',
            'quantity' => 2,
        ]);

        $this->assertDatabaseHas('articles', [
            'id' => $this->article->id,
            'stock' => 8,
        ]);

        $this->user->refresh();
        $this->assertEquals(10, $this->user->points_balance);
    }

    public function test_rejects_string_salon_id(): void
    {
        $payload = array_merge($this->validPayload, ['salon_id' => 's-001']);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['salon_id']);
    }

    public function test_rejects_empty_customer_email(): void
    {
        $payload = array_merge($this->validPayload, ['customer_email' => '']);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['customer_email']);
    }

    public function test_rejects_invalid_customer_email(): void
    {
        $payload = array_merge($this->validPayload, ['customer_email' => 'not-an-email']);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['customer_email']);
    }

    public function test_returns_error_when_stock_insufficient(): void
    {
        $this->article->update(['stock' => 0]);

        $this->mock(TodoPagoClient::class);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $this->validPayload);

        $response->assertStatus(422)
            ->assertJson([
                'ok' => false,
            ]);
        $response->assertSee('Stock insuficiente');
    }

    public function test_try_reverse_payment_called_on_exception(): void
    {
        $this->article->update(['stock' => 0]);

        $payload = array_merge($this->validPayload, [
            'todopago_transaccion_id' => '12345',
        ]);

        $todopagoMock = $this->mock(TodoPagoClient::class);
        $todopagoMock->shouldReceive('paymentReversal')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return isset($data['transactionID'])
                    && $data['transactionID'] === 12345
                    && str_starts_with($data['externalReference'], 'reversal-auto-');
            }), 'json')
            ->andReturn(['ok' => true]);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $payload);

        $response->assertStatus(422);
    }

    public function test_try_reverse_payment_not_called_without_transaccion_id(): void
    {
        $this->article->update(['stock' => 0]);

        $todopagoMock = $this->mock(TodoPagoClient::class);
        $todopagoMock->shouldNotReceive('paymentReversal');

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $this->validPayload);

        $response->assertStatus(422);
    }

    public function test_creates_order_and_returns_redirect_for_non_ajax(): void
    {
        $this->mock(TodoPagoClient::class);

        $response = $this->actingAs($this->user)
            ->post('/rc/pedidos', $this->validPayload);

        $response->assertRedirect(route('rc.orders'));
        $response->assertSessionHas('success');
    }

    public function test_returns_redirect_error_on_runtime_exception_for_non_ajax(): void
    {
        $this->article->update(['stock' => 0]);

        $this->mock(TodoPagoClient::class);

        $response = $this->actingAs($this->user)
            ->post('/rc/pedidos', $this->validPayload);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_allows_nullable_salon_id(): void
    {
        $payload = array_merge($this->validPayload, ['salon_id' => null]);
        unset($payload['salon_id']);

        $this->mock(TodoPagoClient::class);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $payload);

        $response->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('orders', [
            'salon_id' => null,
        ]);
    }

    public function test_validates_items_min_one(): void
    {
        $payload = array_merge($this->validPayload, ['items' => []]);

        $response = $this->actingAs($this->user)
            ->postJson('/rc/pedidos', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['items']);
    }
}
