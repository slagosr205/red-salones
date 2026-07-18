<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TodoPagoClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoPagoControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_direct_payment_accepts_valid_discount_and_taxes(): void
    {
        $user = User::factory()->create();

        $mock = $this->mock(TodoPagoClient::class);
        $mock->shouldReceive('directPayment')
            ->once()
            ->with(\Mockery::on(function ($payload) {
                return isset($payload['discount'])
                    && (float) $payload['discount'] === 10.0
                    && isset($payload['taxes'])
                    && (float) $payload['taxes'] === 15.0
                    && $payload['ipAddress'] === '127.0.0.1';
            }), 'json')
            ->andReturn([
                'ok' => true,
                'status' => 200,
                'data' => ['transactionID' => 12345],
            ]);

        $payload = [
            'accountNumber' => '4111111111111111',
            'cardHolderName' => 'John Doe',
            'expirationMonth' => '12',
            'expirationYear' => '2028',
            'cvc' => '123',
            'amount' => 100.00,
            'currency' => 'HNL',
            'customerName' => 'John Doe',
            'customerEmail' => 'john@example.com',
            'identificationNumber' => '1234567890',
            'identificationTypeID' => 1,
            'taxes' => 15.00,
            'discount' => 10.00,
            'externalReference' => 'test-ref-001',
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', $payload);

        $response->assertOk();
    }

    public function test_direct_payment_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'accountNumber', 'cardHolderName', 'expirationMonth',
            'expirationYear', 'cvc', 'amount', 'currency',
            'customerName', 'customerEmail', 'externalReference',
        ]);
    }

    public function test_direct_payment_validates_amount_minimum(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', [
                'accountNumber' => '4111111111111111',
                'cardHolderName' => 'John Doe',
                'expirationMonth' => '12',
                'expirationYear' => '2028',
                'cvc' => '123',
                'amount' => 0,
                'currency' => 'HNL',
                'customerName' => 'John Doe',
                'customerEmail' => 'john@example.com',
                'externalReference' => 'test-ref-002',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount']);
    }

    public function test_direct_payment_rejects_negative_taxes(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', [
                'accountNumber' => '4111111111111111',
                'cardHolderName' => 'John Doe',
                'expirationMonth' => '12',
                'expirationYear' => '2028',
                'cvc' => '123',
                'amount' => 100.00,
                'currency' => 'HNL',
                'customerName' => 'John Doe',
                'customerEmail' => 'john@example.com',
                'taxes' => -5.00,
                'externalReference' => 'test-ref-003',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['taxes']);
    }

    public function test_direct_payment_rejects_negative_discount(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', [
                'accountNumber' => '4111111111111111',
                'cardHolderName' => 'John Doe',
                'expirationMonth' => '12',
                'expirationYear' => '2028',
                'cvc' => '123',
                'amount' => 100.00,
                'currency' => 'HNL',
                'customerName' => 'John Doe',
                'customerEmail' => 'john@example.com',
                'discount' => -5.00,
                'externalReference' => 'test-ref-004',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['discount']);
    }

    public function test_direct_payment_idempotency_returns_cached_result(): void
    {
        $user = User::factory()->create();

        $mock = $this->mock(TodoPagoClient::class);
        $mock->shouldReceive('directPayment')
            ->once()
            ->andReturn([
                'ok' => true,
                'status' => 200,
                'data' => ['transactionID' => 99999],
            ]);

        $payload = [
            'accountNumber' => '4111111111111111',
            'cardHolderName' => 'John Doe',
            'expirationMonth' => '12',
            'expirationYear' => '2028',
            'cvc' => '123',
            'amount' => 100.00,
            'currency' => 'HNL',
            'customerName' => 'John Doe',
            'customerEmail' => 'john@example.com',
            'externalReference' => 'idempotent-ref-001',
        ];

        $response1 = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', $payload);
        $response1->assertOk();

        $response2 = $this->actingAs($user)
            ->postJson('/api/todopago/direct-payment', $payload);
        $response2->assertOk();
        $response2->assertJsonFragment(['transactionID' => 99999]);
    }
}
