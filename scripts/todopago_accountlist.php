<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

$customerId = $argv[1] ?? null;
if (! is_string($customerId) || $customerId === '') {
    fwrite(STDERR, 'Usage: php scripts/todopago_accountlist.php <customerID>'.PHP_EOL);
    exit(2);
}

function maskSensitive(mixed $v): mixed
{
    if (is_array($v)) {
        $out = [];
        foreach ($v as $k => $vv) {
            if (is_string($k) && in_array(strtolower($k), ['tokenaccount', 'pan', 'cardnumber'], true) && is_string($vv)) {
                $out[$k] = strlen($vv) <= 8
                    ? '********'
                    : str_repeat('*', max(0, strlen($vv) - 4)).substr($vv, -4);

                continue;
            }
            $out[$k] = maskSensitive($vv);
        }

        return $out;
    }

    return $v;
}

try {
    $resp = $client->accountList($customerId, [], 'json');
    $resp = maskSensitive($resp);
    echo json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $e) {
    echo 'ACCOUNT_LIST_FAIL: '.$e->getMessage().PHP_EOL;
    exit(1);
}
