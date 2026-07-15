<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

// Login
$loginRes = Http::baseUrl(config('services.todopago.base_url'))
    ->acceptJson()->asJson()->timeout(20)
    ->withHeaders(['X-Tenant' => config('services.todopago.tenant')])
    ->post(config('services.todopago.login_path'), [
        'user' => config('services.todopago.user'),
        'password' => config('services.todopago.password'),
        'userType' => (int) config('services.todopago.user_type', '2'),
        'version' => (string) config('services.todopago.version', ''),
    ]);

echo 'Login HTTP: '.$loginRes->status().PHP_EOL;
$loginJson = $loginRes->json();
$token = $loginJson['data']['token'] ?? $loginJson['token'] ?? '';
echo 'Token: ...'.substr($token, -10).PHP_EOL.PHP_EOL;

$tenant = (string) config('services.todopago.tenant');
$payload = [
    'accountNumber' => '4000000000000002',
    'cardHolderName' => 'Test',
    'expirationMonth' => '12',
    'expirationYear' => '28',
    'cvc' => '123',
    'amount' => 1,
    'currency' => 'HNL',
    'customerName' => 'Test',
    'customerEmail' => 'test@test.com',
    'ipAddress' => '127.0.0.1',
    'commerceID' => '1170',
    'terminalID' => '1',
];

// Test with Laravel HTTP client
$res1 = Http::baseUrl(config('services.todopago.base_url'))
    ->acceptJson()
    ->asJson()
    ->timeout(30)
    ->withHeaders([
        'X-Tenant' => $tenant,
        'X-Token' => $token,
        'X-Content' => 'json',
    ])
    ->post(config('services.todopago.direct_payment_path'), $payload);

echo '=== Laravel HTTP client ==='.PHP_EOL;
echo 'Status: '.$res1->status().PHP_EOL;
echo 'Headers: '.json_encode($res1->headers()).PHP_EOL;
echo 'Body: '.$res1->body().PHP_EOL.PHP_EOL;

// Test with cURL using same payload/headers
$jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES);
$url = config('services.todopago.base_url').config('services.todopago.direct_payment_path');

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $jsonPayload,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-Tenant: '.$tenant,
        'X-Token: '.$token,
        'X-Content: json',
        'Content-Length: '.strlen($jsonPayload),
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HEADER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$respHeaders = substr($response, 0, $headerSize);
$respBody = substr($response, $headerSize);
$error = curl_error($ch);

echo '=== cURL ==='.PHP_EOL;
echo 'Status: '.$httpCode.PHP_EOL;
if ($error) {
    echo 'CURL Error: '.$error.PHP_EOL;
}
echo 'Response Headers:'.PHP_EOL.$respHeaders.PHP_EOL;
echo 'Body: '.$respBody.PHP_EOL;

curl_close($ch);
