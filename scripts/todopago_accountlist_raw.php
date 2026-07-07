<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

$customerId = (int) ($argv[1] ?? 1);

try {
    $resp = $client->accountList($customerId, [], 'json');
    echo json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $e) {
    echo 'FAIL: '.$e->getMessage().PHP_EOL;
    exit(1);
}
