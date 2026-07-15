<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$client = $app->make(TodoPagoClient::class);

// Simula EXACTAMENTE lo que envía el frontend
$payload = [
    'accountNumber' => '4000000000000002',
    'cardHolderName' => 'Salon Demo',
    'expirationMonth' => '12',
    'expirationYear' => '28',
    'cvc' => '123',
    'amount' => 1.00,
    'currency' => 'HNL',
    'customerName' => 'Salon Demo',
    'customerEmail' => 'salon@salon.test',
    'externalReference' => 'rc-'.date('Ymd-His'),
    'ipAddress' => '127.0.0.1',
];

echo 'Enviando payload: '.json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL.PHP_EOL;

try {
    $resp = $client->directPayment($payload, 'json');
    echo 'RESPUESTA: '.json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
}
