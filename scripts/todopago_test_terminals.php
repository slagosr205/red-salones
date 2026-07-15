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

echo 'Token: ...'.substr($token, -10).PHP_EOL;
echo 'CommerceID from login: '.($login['raw']['data']['commmerceID'] ?? $login['raw']['data']['commerceID'] ?? '?').PHP_EOL;
echo 'CommerceName: '.($login['raw']['data']['commmerceName'] ?? '?').PHP_EOL.PHP_EOL;

$tenant = (string) config('services.todopago.tenant');
$path = (string) config('services.todopago.direct_payment_path');

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

$terminals = ['1', '2', '3', '01', '001', '0'];

foreach ($terminals as $term) {
    $payload = array_merge($base, ['commerceID' => '1170', 'terminalID' => $term]);
    $res = Http::baseUrl(config('services.todopago.base_url'))
        ->acceptJson()->asJson()->timeout(30)
        ->withHeaders([
            'X-Tenant' => $tenant,
            'X-Token' => $token,
            'X-Content' => 'json',
        ])
        ->post($path, $payload);

    $json = $res->json();
    $msg = $json['message'] ?? '(no message)';
    echo 'Terminal "'.$term.'" -> HTTP '.$res->status().' : '.$msg.PHP_EOL;
}

echo PHP_EOL.'--- DONE ---'.PHP_EOL;
