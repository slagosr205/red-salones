<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TodoPagoClient
{
    private const TOKEN_CACHE_KEY = 'todopago.token';

    private function baseUrl(): string
    {
        return (string) config('services.todopago.base_url');
    }

    private function tenant(): string
    {
        return (string) config('services.todopago.tenant');
    }

    private function loginPath(): string
    {
        return (string) config('services.todopago.login_path');
    }

    private function paymentPath(): string
    {
        return (string) config('services.todopago.payment_path');
    }

    private function accountListPath(): string
    {
        return (string) config('services.todopago.account_list_path');
    }

    private function customerRegisterPath(): string
    {
        return (string) config('services.todopago.customer_register_path');
    }

    private function accountRegisterPath(): string
    {
        return (string) config('services.todopago.account_register_path');
    }

    private function directPaymentPath(): string
    {
        return (string) config('services.todopago.direct_payment_path');
    }

    private function paymentReversalPath(): string
    {
        return (string) config('services.todopago.payment_reversal_path');
    }

    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    private function maskSensitive(array $data): array
    {
        $masked = $data;
        foreach (['password', 'cvc', 'cvv', 'securityCode'] as $field) {
            if (isset($masked[$field])) {
                $masked[$field] = '******';
            }
        }
        foreach (['accountNumber', 'cardNumber', 'pan'] as $field) {
            if (isset($masked[$field]) && is_string($masked[$field])) {
                $len = strlen($masked[$field]);
                $masked[$field] = str_repeat('*', max(0, $len - 4)).substr($masked[$field], -4);
            }
        }

        return $masked;
    }

    private function commerceId(): string
    {
        return (string) config('services.todopago.commerce_id');
    }

    private function terminalId(): string
    {
        return (string) config('services.todopago.terminal');
    }

    /**
     * @return array{token:string, expiration:Carbon|null, raw:array|null}
     */
    public function login(): array
    {
        $url = rtrim(trim($this->baseUrl()), '/').$this->loginPath();
        if ($this->loginPath() === '') {
            throw new \RuntimeException('TODOPAGO_LOGIN_PATH no configurado.');
        }

        $payload = [
            'user' => trim((string) config('services.todopago.user')),
            'password' => (string) config('services.todopago.password'),
            'userType' => (string) config('services.todopago.user_type', '2'),
        ];

        $headers = [
            'Accept' => 'application/json, text/plain, */*',
            'X-Content' => 'json',
        ];

        $tenant = $this->tenant();
        if ($tenant !== '') {
            $headers['X-Tenant'] = $tenant;
        }

        $res = Http::withHeaders($headers)
            ->withOptions([
                'allow_redirects' => false,
                'http_errors' => false,
            ])
            ->timeout(20)
            ->withBody(
                json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'application/json; charset=UTF-8'
            )
            ->post($url);

        if ($res->redirect()) {
            $location = $res->header('Location')[0] ?? '';
            if ($location !== '') {
                if (str_starts_with($location, '/')) {
                    $location = rtrim($this->baseUrl(), '/').$location;
                }
                $res = Http::withHeaders($headers)
                    ->withOptions([
                        'allow_redirects' => false,
                        'http_errors' => false,
                    ])
                    ->timeout(20)
                    ->withBody(
                        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                        'application/json; charset=UTF-8'
                    )
                    ->post($location);
            }
        }

        if (! $res->successful()) {
            $body = $res->body();
            if (is_string($body) && strlen($body) > 800) {
                $body = substr($body, 0, 800).'...';
            }

            Log::error('TodoPago login HTTP error', [
                'status' => $res->status(),
                'response' => $body,
                'path' => $url,
            ]);

            throw new \RuntimeException('TodoPago login HTTP '.$res->status().': '.($body ?: '(empty body)'));
        }

        $json = $res->json();

        // Expected: { data: { token, expirationDate } }
        $token = data_get($json, 'data.token')
            ?? data_get($json, 'token');

        if (! is_string($token) || $token === '') {
            $keys = is_array($json) ? implode(',', array_slice(array_keys($json), 0, 40)) : 'n/a';

            Log::error('TodoPago login no devolvio token', [
                'response_keys' => $keys,
                'response' => $json,
                'status' => $res->status(),
            ]);

            throw new \RuntimeException('TodoPago login no devolvio token (keys: '.$keys.').');
        }

        $expirationRaw = data_get($json, 'data.expirationDate');
        $expiration = null;
        if (is_string($expirationRaw) && $expirationRaw !== '') {
            try {
                $expiration = Carbon::createFromFormat('d/m/Y H:i:s', $expirationRaw);
            } catch (\Throwable) {
                $expiration = null;
            }
        }

        return [
            'token' => $token,
            'expiration' => $expiration,
            'raw' => is_array($json) ? $json : null,
        ];
    }

    public function getToken(): string
    {
        $cached = Cache::get(self::TOKEN_CACHE_KEY);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $login = $this->login();
        $ttlSeconds = 10 * 60;
        if ($login['expiration'] instanceof Carbon) {
            $ttlSeconds = max(60, now()->diffInSeconds($login['expiration']->copy()->subSeconds(60), false));
        }

        Cache::put(self::TOKEN_CACHE_KEY, $login['token'], $ttlSeconds);

        return $login['token'];
    }

    /**
     * @param  array<string,mixed>  $payload
     * @return array<string,mixed>
     */
    public function pay(array $payload, string $contentMode = 'json'): array
    {
        $token = $this->getToken();

        $tenant = $this->tenant();
        if ($tenant === '') {
            throw new \RuntimeException('TODOPAGO_TENANT no configurado.');
        }

        $contentMode = strtolower(trim($contentMode));
        if ($contentMode === '') {
            $contentMode = 'json';
        }

        // Ensure commerce/terminal IDs are present.
        $payload = Arr::add($payload, 'commerceID', $this->commerceId());
        $payload = Arr::add($payload, 'terminalNbr', $this->terminalId());
        $payload['currency'] = strtoupper($payload['currency'] ?? 'HNL');

        $res = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->timeout(30)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => $contentMode,
            ])
            ->post($this->paymentPath(), $payload);

        $json = $res->json();
        if (! is_array($json)) {
            Log::error('TodoPago pay respuesta invalida', [
                'status' => $res->status(),
                'body' => $res->body(),
                'payload' => $this->maskSensitive($payload),
                'path' => $this->paymentPath(),
            ]);
            throw new \RuntimeException('Respuesta invalida de TodoPago pay.');
        }

        if (! $res->successful()) {
            Log::error('TodoPago pay HTTP error', [
                'status' => $res->status(),
                'response' => $json,
                'payload' => $this->maskSensitive($payload),
                'path' => $this->paymentPath(),
            ]);
        }

        return $json;
    }

    /**
     * @return array<string,mixed>
     */
    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    public function customerRegister(array $data, string $contentMode = 'json'): array
    {
        $token = $this->getToken();

        $tenant = $this->tenant();
        if ($tenant === '') {
            throw new \RuntimeException('TODOPAGO_TENANT no configurado.');
        }

        $res = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => $contentMode,
            ])
            ->post($this->customerRegisterPath(), $data);

        if (! $res->successful()) {
            $body = $res->body();
            Log::error('TodoPago customer-register HTTP error', [
                'status' => $res->status(),
                'response' => $body,
                'payload' => $this->maskSensitive($data),
                'path' => $this->customerRegisterPath(),
            ]);
            throw new \RuntimeException('TodoPago customer-register HTTP '.$res->status().': '.($body ?: '(empty body)'));
        }

        $json = $res->json();
        if (! is_array($json)) {
            Log::error('TodoPago customer-register respuesta invalida', [
                'status' => $res->status(),
                'body' => $res->body(),
                'payload' => $this->maskSensitive($data),
            ]);
            throw new \RuntimeException('Respuesta invalida de TodoPago customer-register.');
        }

        return $json;
    }

    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    public function accountRegister(array $data, string $contentMode = 'json'): array
    {
        $token = $this->getToken();

        $tenant = $this->tenant();
        if ($tenant === '') {
            throw new \RuntimeException('TODOPAGO_TENANT no configurado.');
        }

        $data['commerceID'] = $this->commerceId();

        $res = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => $contentMode,
            ])
            ->post($this->accountRegisterPath(), $data);

        if (! $res->successful()) {
            $body = $res->body();
            Log::error('TodoPago account-register HTTP error', [
                'status' => $res->status(),
                'response' => $body,
                'payload' => $this->maskSensitive($data),
                'path' => $this->accountRegisterPath(),
            ]);
            throw new \RuntimeException('TodoPago account-register HTTP '.$res->status().': '.($body ?: '(empty body)'));
        }

        $json = $res->json();
        if (! is_array($json)) {
            Log::error('TodoPago account-register respuesta invalida', [
                'status' => $res->status(),
                'body' => $res->body(),
                'payload' => $this->maskSensitive($data),
            ]);
            throw new \RuntimeException('Respuesta invalida de TodoPago account-register.');
        }

        return $json;
    }

    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    public function directPayment(array $data, string $contentMode = 'json'): array
    {
        $token = $this->getToken();

        $tenant = $this->tenant();
        if ($tenant === '') {
            throw new \RuntimeException('TODOPAGO_TENANT no configurado.');
        }

        $data = Arr::add($data, 'commerceID', $this->commerceId());
        $data = Arr::add($data, 'terminalNbr', $this->terminalId());
        $data['currency'] = strtoupper($data['currency'] ?? 'HNL');

        Log::info('TodoPago direct-payment request', [
            'payload' => $this->maskSensitive($data),
            'path' => $this->directPaymentPath(),
            'url' => $this->baseUrl().$this->directPaymentPath(),
        ]);

        $res = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->timeout(30)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => $contentMode,
            ])
            ->post($this->directPaymentPath(), $data);

        if (! $res->successful()) {
            $body = $res->body();
            Log::error('TodoPago direct-payment HTTP error', [
                'status' => $res->status(),
                'response' => $body,
                'payload' => $this->maskSensitive($data),
                'path' => $this->directPaymentPath(),
            ]);
            throw new \RuntimeException('TodoPago direct-payment HTTP '.$res->status().': '.($body ?: '(empty body)'));
        }

        $json = $res->json();
        if (! is_array($json)) {
            Log::error('TodoPago direct-payment respuesta invalida', [
                'status' => $res->status(),
                'body' => $res->body(),
                'payload' => $this->maskSensitive($data),
            ]);
            throw new \RuntimeException('Respuesta invalida de TodoPago direct-payment.');
        }

        return $json;
    }

    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    public function paymentReversal(array $data, string $contentMode = 'json'): array
    {
        $token = $this->getToken();

        $tenant = $this->tenant();
        if ($tenant === '') {
            throw new \RuntimeException('TODOPAGO_TENANT no configurado.');
        }

        $res = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->timeout(30)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => $contentMode,
            ])
            ->post($this->paymentReversalPath(), $data);

        $json = $res->json();
        if (! is_array($json)) {
            Log::error('TodoPago payment-reversal respuesta invalida', [
                'status' => $res->status(),
                'body' => $res->body(),
                'payload' => $this->maskSensitive($data),
                'path' => $this->paymentReversalPath(),
            ]);
            throw new \RuntimeException('Respuesta invalida de TodoPago payment-reversal.');
        }

        if (! $res->successful()) {
            Log::error('TodoPago payment-reversal HTTP error', [
                'status' => $res->status(),
                'response' => $json,
                'payload' => $this->maskSensitive($data),
                'path' => $this->paymentReversalPath(),
            ]);
        }

        return $json;
    }

    /**
     * @param  array<string,mixed>  $query
     * @return array<string,mixed>
     */
    public function accountList(int|string $customerId, array $query = [], string $contentMode = 'json'): array
    {
        $token = $this->getToken();

        $tenant = $this->tenant();
        if ($tenant === '') {
            throw new \RuntimeException('TODOPAGO_TENANT no configurado.');
        }

        $contentMode = strtolower(trim($contentMode));
        if ($contentMode === '') {
            $contentMode = 'json';
        }

        if ((string) $customerId === '') {
            throw new \RuntimeException('customerID requerido para account-list.');
        }

        // The gateway expects customerID as a query parameter (int64).
        $query = ['customerID' => (int) $customerId] + $query;

        $res = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => $contentMode,
            ])
            ->get($this->accountListPath(), $query);

        if (! $res->successful()) {
            $body = $res->body();
            if (is_string($body) && strlen($body) > 800) {
                $body = substr($body, 0, 800).'...';
            }
            Log::error('TodoPago account-list HTTP error', [
                'status' => $res->status(),
                'response' => $body,
                'customerID' => $customerId,
                'query' => $query,
                'path' => $this->accountListPath(),
            ]);
            throw new \RuntimeException('TodoPago account-list HTTP '.$res->status().': '.($body ?: '(empty body)'));
        }

        $json = $res->json();
        if (! is_array($json)) {
            Log::error('TodoPago account-list respuesta invalida', [
                'status' => $res->status(),
                'body' => $res->body(),
                'customerID' => $customerId,
            ]);
            throw new \RuntimeException('Respuesta invalida de TodoPago account-list.');
        }

        return $json;
    }
}
