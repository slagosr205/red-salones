<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$client = $app->make(TodoPagoClient::class);

try {
    $login = $client->login();
    echo 'Token (last 10): ...'.substr($login['token'], -10).PHP_EOL;
    echo 'Expiration: '.($login['expiration']?->format('Y-m-d H:i:s') ?? 'null').PHP_EOL;
    echo 'Raw response: '.json_encode($login['raw'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
}
