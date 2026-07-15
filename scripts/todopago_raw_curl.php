<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$client = $app->make(TodoPagoClient::class);

$login = $client->login();
$token = $login['token'];
echo 'Token: ...'.substr($token, -10).PHP_EOL.PHP_EOL;

$base = [
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
];

function testPayload(string $label, array $payload, string $token): void
{
    echo '=== '.$label.' ==='.PHP_EOL;

    $curl = curl_init('https://test-api.todopago.hn/pay/v1/direct-payment-without-register');
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES);

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $json,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-Tenant: HNTP',
            'X-Token: '.$token,
            'X-Content: json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);

    echo 'Payload: '.$json.PHP_EOL;
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);

    echo 'HTTP '.$httpCode.PHP_EOL;
    if ($error) {
        echo 'CURL Error: '.$error.PHP_EOL;
    }
    echo 'Response: '.$response.PHP_EOL.PHP_EOL;

    curl_close($curl);
}

// Test 1: ints
testPayload('ints', array_merge($base, [
    'commerceID' => 1170,
    'terminalID' => 1,
]), $token);

// Test 2: strings
testPayload('strings', array_merge($base, [
    'commerceID' => '1170',
    'terminalID' => '1',
]), $token);

echo '--- DONE ---'.PHP_EOL;
