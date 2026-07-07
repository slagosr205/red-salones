<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$customerId = $argv[1] ?? null;
if (! is_string($customerId) || $customerId === '') {
    fwrite(STDERR, 'Usage: php scripts/todopago_accountlist_header_probe.php <customerID>'.PHP_EOL);
    exit(2);
}

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

$token = $client->getToken();
$baseUrl = (string) config('services.todopago.base_url');
$path = (string) config('services.todopago.account_list_path');
$tenant = (string) config('services.todopago.tenant');

$headerKeys = [
    'customerID',
    'customerId',
    'CustomerID',
    'CustomerId',
    'X-CustomerID',
    'X-Customer-Id',
    'X-CustomerId',
];

foreach ($headerKeys as $k) {
    echo 'Trying header '.$k.'='.$customerId.PHP_EOL;
    $res = Http::baseUrl($baseUrl)
        ->acceptJson()
        ->asJson()
        ->timeout(20)
        ->withHeaders([
            'X-Tenant' => $tenant,
            'X-Token' => $token,
            'X-Content' => 'json',
            $k => $customerId,
        ])
        ->get($path);

    echo 'HTTP '.$res->status().PHP_EOL;
    $body = $res->body();
    if (is_string($body) && strlen($body) > 600) {
        $body = substr($body, 0, 600).'...';
    }
    echo ($body ?: '(empty)').PHP_EOL;
    echo '---'.PHP_EOL;

    echo 'Trying URL path '.$path.'/'.$customerId.' with header '.$k.PHP_EOL;
    $res2 = Http::baseUrl($baseUrl)
        ->acceptJson()
        ->asJson()
        ->timeout(20)
        ->withHeaders([
            'X-Tenant' => $tenant,
            'X-Token' => $token,
            'X-Content' => 'json',
            $k => $customerId,
        ])
        ->get($path.'/'.$customerId);

    echo 'HTTP '.$res2->status().PHP_EOL;
    $body2 = $res2->body();
    if (is_string($body2) && strlen($body2) > 600) {
        $body2 = substr($body2, 0, 600).'...';
    }
    echo ($body2 ?: '(empty)').PHP_EOL;
    echo '---'.PHP_EOL;
}

echo 'Note: account-list works with query param customerID (case-sensitive).'.PHP_EOL;
