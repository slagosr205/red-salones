<?php

namespace App\Http\Controllers;

use App\Services\TodoPagoClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TodoPagoController extends Controller
{
    public function health(TodoPagoClient $client): JsonResponse
    {
        try {
            // Base connectivity check.
            $res = Http::baseUrl((string) config('services.todopago.base_url'))
                ->acceptJson()
                ->timeout(10)
                ->get('/health');

            return response()->json([
                'ok' => $res->successful(),
                'status' => $res->status(),
                'data' => $res->json(),
            ], $res->successful() ? 200 : 502);
        } catch (\Throwable $e) {
            Log::error('TodoPago health fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'No se pudo conectar a TodoPago.',
            ], 502);
        }
    }

    public function login(TodoPagoClient $client): JsonResponse
    {
        try {
            $login = $client->login();

            $token = $login['token'];
            $maskedToken = strlen($token) <= 8
                ? '********'
                : str_repeat('*', max(0, strlen($token) - 6)).substr($token, -6);

            return response()->json([
                'ok' => true,
                // Do not return the full token.
                'token' => $maskedToken,
                'expirationDate' => $login['expiration']?->format('d/m/Y H:i:s'),
                'data' => [
                    'commerceID' => data_get($login['raw'], 'data.commmerceID') ?? data_get($login['raw'], 'data.commerceID'),
                    'userType' => data_get($login['raw'], 'data.userType'),
                    'userName' => data_get($login['raw'], 'data.userName'),
                    'commmerceName' => data_get($login['raw'], 'data.commmerceName') ?? data_get($login['raw'], 'data.commerceName'),
                    'activeUser' => data_get($login['raw'], 'data.activeUser'),
                    'mustChangePassword' => data_get($login['raw'], 'data.mustChangePassword'),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('TodoPago login fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo login TodoPago.',
            ], 502);
        }
    }

    public function pay(Request $request, TodoPagoClient $client): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['required', 'string', 'max:10'],
            'tokenAccount' => ['required', 'string', 'max:255'],
            'customerWalletID' => ['required', 'integer', 'min:0'],
            'externalReference' => ['nullable', 'string', 'max:255'],
            'comment' => ['nullable', 'string', 'max:255'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'tips' => ['nullable', 'numeric', 'min:0'],
            'metaData' => ['nullable', 'array'],
            'metaData.*.name' => ['required_with:metaData', 'string', 'max:100'],
            'metaData.*.value' => ['required_with:metaData', 'string', 'max:255'],
            // Optional fields if you need them later.
            'billerID' => ['nullable', 'integer'],
            'customerCouponID' => ['nullable', 'integer'],
            'terminalNbr' => ['nullable', 'string', 'max:50'],
            'ipAddress' => ['nullable', 'string', 'max:64'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);

        $payload = $validated;
        // Default IP if not provided.
        $payload['ipAddress'] = $payload['ipAddress'] ?? $request->ip();

        // Ensure these cannot be overridden from the client.
        unset($payload['commerceID'], $payload['terminalID'], $payload['terminalNbr']);

        try {
            $resp = $client->pay($payload, contentMode: 'json');

            // Preserve the gateway envelope as-is.
            $status = (int) (data_get($resp, 'status') ?? 200);
            if ($status < 100 || $status > 599) {
                $status = 200;
            }

            return response()->json($resp, $status);
        } catch (\Throwable $e) {
            Log::error('TodoPago pay fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo pago TodoPago.',
            ], 502);
        }
    }

    public function directPayment(Request $request, TodoPagoClient $client): JsonResponse
    {
        $validated = $request->validate([
            'accountNumber' => ['required', 'string', 'max:20'],
            'cardHolderName' => ['required', 'string', 'max:255'],
            'expirationMonth' => ['required', 'string', 'max:2'],
            'expirationYear' => ['required', 'string', 'max:4'],
            'cvc' => ['required', 'string', 'max:4'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['required', 'string', 'max:10'],
            'customerName' => ['required', 'string', 'max:255'],
            'customerEmail' => ['required', 'email', 'max:255'],
            'identificationNumber' => ['nullable', 'string', 'max:50'],
            'identificationTypeID' => ['nullable', 'integer', 'min:1'],
            'externalReference' => ['nullable', 'string', 'max:255'],
            'comment' => ['nullable', 'string', 'max:255'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tips' => ['nullable', 'numeric', 'min:0'],
            'ipAddress' => ['nullable', 'string', 'max:64'],
        ]);

        $payload = $validated;
        $payload['ipAddress'] = $payload['ipAddress'] ?? $request->ip();

        try {
            $resp = $client->directPayment($payload, 'json');
            $status = (int) (data_get($resp, 'status') ?? 200);
            if ($status < 100 || $status > 599) {
                $status = 200;
            }

            return response()->json($resp, $status);
        } catch (\Throwable $e) {
            Log::error('TodoPago direct-payment fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo pago directo TodoPago: '.$e->getMessage(),
            ], 502);
        }
    }

    public function reversal(Request $request, TodoPagoClient $client): JsonResponse
    {
        $validated = $request->validate([
            'transactionID' => ['required', 'integer', 'min:1'],
            'externalReference' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $resp = $client->paymentReversal($validated, 'json');
            $status = (int) (data_get($resp, 'status') ?? 200);
            if ($status < 100 || $status > 599) {
                $status = 200;
            }

            return response()->json($resp, $status);
        } catch (\Throwable $e) {
            Log::error('TodoPago reversal fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'transactionID' => $validated['transactionID'] ?? null,
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo reversión TodoPago: '.$e->getMessage(),
            ], 502);
        }
    }

    public function customerRegister(Request $request, TodoPagoClient $client): JsonResponse
    {
        $validated = $request->validate([
            'customerName' => ['required', 'string', 'max:255'],
            'customerEmail' => ['required', 'email', 'max:255'],
            'cellPhone' => ['required', 'string', 'max:50'],
            'identificationNumber' => ['required', 'string', 'max:50'],
            'identificationTypeID' => ['required', 'integer', 'min:1'],
            'birthDate' => ['nullable', 'date'],
            'cityID' => ['nullable', 'integer'],
        ]);

        try {
            $resp = $client->customerRegister($validated, 'json');
            $status = (int) (data_get($resp, 'status') ?? 200);
            if ($status < 100 || $status > 599) {
                $status = 200;
            }

            return response()->json($resp, $status);
        } catch (\Throwable $e) {
            Log::error('TodoPago customer-register fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo registro de cliente TodoPago: '.$e->getMessage(),
            ], 502);
        }
    }

    public function accountRegister(Request $request, TodoPagoClient $client): JsonResponse
    {
        $validated = $request->validate([
            'customerID' => ['required', 'integer', 'min:1'],
            'accountNumber' => ['required', 'string', 'max:20'],
            'cardHolderName' => ['required', 'string', 'max:255'],
            'expirationMonth' => ['required', 'string', 'max:2'],
            'expirationYear' => ['required', 'string', 'max:4'],
            'cvc' => ['required', 'string', 'max:4'],
            'alias' => ['nullable', 'string', 'max:100'],
            'walletType' => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $resp = $client->accountRegister($validated, 'json');
            $status = (int) (data_get($resp, 'status') ?? 200);
            if ($status < 100 || $status > 599) {
                $status = 200;
            }

            return response()->json($resp, $status);
        } catch (\Throwable $e) {
            Log::error('TodoPago account-register fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo registro de cuenta TodoPago: '.$e->getMessage(),
            ], 502);
        }
    }

    public function accounts(TodoPagoClient $client): JsonResponse
    {
        try {
            $customerId = request()->query('customerID');
            if (! is_string($customerId) || $customerId === '') {
                return response()->json([
                    'ok' => false,
                    'message' => 'customerID requerido.',
                ], 422);
            }

            $resp = $client->accountList($customerId, [], 'json');

            return response()->json($resp, 200);
        } catch (\Throwable $e) {
            Log::error('TodoPago account-list fallo', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'customerID' => request()->query('customerID'),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Fallo account-list TodoPago.',
            ], 502);
        }
    }
}
