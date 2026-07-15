<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$client = $app->make(TodoPagoClient::class);
$login = $client->login();
$token = $login['token'];

echo 'Token: ...'.substr($token, -10).PHP_EOL.PHP_EOL;

$tenant = (string) config('services.todopago.tenant');
$baseUrl = (string) config('services.todopago.base_url');
$path = (string) config('services.todopago.direct_payment_path');
$url = $baseUrl.$path;

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

// Test 1: Laravel HTTP client
echo '=== Test 1: Laravel HTTP client ==='.PHP_EOL;
$res1 = Http::baseUrl($baseUrl)
    ->acceptJson()->asJson()->timeout(30)
    ->withHeaders([
        'X-Tenant' => $tenant,
        'X-Token' => $token,
        'X-Content' => 'json',
    ])
    ->post($path, $payload);

echo 'Status: '.$res1->status().PHP_EOL;
echo 'Body: '.$res1->body().PHP_EOL.PHP_EOL;

// Test 2: Same payload but using ->send() to capture what headers are sent
echo '=== Test 2: cURL with all headers ==='.PHP_EOL;
$jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES);

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
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HEADER => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2TLS,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$respHeaders = substr($response, 0, $headerSize);
$respBody = substr($response, $headerSize);
$error = curl_error($ch);
$info = curl_getinfo($ch);

echo 'Status: '.$httpCode.PHP_EOL;
echo 'Content-Type: '.($info['content_type'] ?? '?').PHP_EOL;
if ($error) {
    echo 'CURL Error: '.$error.PHP_EOL;
}
echo 'Response: '.$respBody.PHP_EOL;

curl_close($ch);

// Test 3: cURL with Guzzle-style PSR7 (maybe a Laravel-specific header difference)
echo PHP_EOL.'=== Test 3: cURL with User-Agent like Laravel ==='.PHP_EOL;
$ch2 = curl_init($url);
curl_setopt_array($ch2, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $jsonPayload,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-Tenant: '.$tenant,
        'X-Token: '.$token,
        'X-Content: json',
        'User-Agent: GuzzleHttp/7',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HEADER => true,
]);

$response2 = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
$headerSize2 = curl_getinfo($ch2, CURLINFO_HEADER_SIZE);
$respBody2 = substr($response2, $headerSize2);

echo 'Status: '.$httpCode2.PHP_EOL;
echo 'Response: '.$respBody2.PHP_EOL;

curl_close($ch2);

echo PHP_EOL.'--- DONE ---'.PHP_EOL;
