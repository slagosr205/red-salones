<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Customer;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class PaymentController extends Controller
{
    public function createPaymentIntent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:100',
            'currency' => 'required|string|size:3',
            'customerName' => 'required|string|max:255',
            'customerEmail' => 'required|string|email|max:255',
        ]);

        Stripe::setApiKey(config('services.stripe.secret'));

        try {
            $customer = Customer::create([
                'name' => $validated['customerName'],
                'email' => $validated['customerEmail'],
                'description' => 'Cliente salon - Red Comercial de Salones',
            ]);

            $intent = PaymentIntent::create([
                'amount' => $validated['amount'],
                'currency' => $validated['currency'],
                'customer' => $customer->id,
                'receipt_email' => $validated['customerEmail'],
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'customer_name' => $validated['customerName'],
                ],
            ]);

            return response()->json([
                'success' => true,
                'clientSecret' => $intent->client_secret,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pago: '.$e->getMessage(),
            ], 500);
        }
    }
}
