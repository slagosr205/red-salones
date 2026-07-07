<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

$commerceId = (int) config('services.todopago.commerce_id');
$terminalId = (int) config('services.todopago.terminal');

$customerId = $argv[1] ?? null;
if (! is_string($customerId) || $customerId === '') {
    fwrite(STDERR, 'Usage: php scripts/todopago_accountlist_probe.php <customerID>'.PHP_EOL);
    exit(2);
}

$candidates = [
    [],
    ['commerceID' => $commerceId],
    ['terminalID' => $terminalId],
    ['commerceID' => $commerceId, 'terminalID' => $terminalId],
    ['commerceId' => $commerceId, 'terminalId' => $terminalId],
    ['merchant' => $commerceId, 'terminal' => $terminalId],
    ['customerWalletID' => 0],
    ['customerWalletID' => 0, 'commerceID' => $commerceId, 'terminalID' => $terminalId],
];

foreach ($candidates as $i => $q) {
    echo 'Trying query #'.$i.': '.json_encode($q).PHP_EOL;
    try {
        $resp = $client->accountList($customerId, $q, 'json');
        echo "OK\n";
        echo json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
        exit(0);
    } catch (Throwable $e) {
        echo 'FAIL: '.$e->getMessage().PHP_EOL;
    }
}

echo '---- Trying POST variants ----'.PHP_EOL;

$token = $client->getToken();
$baseUrl = (string) config('services.todopago.base_url');
$path = (string) config('services.todopago.account_list_path');
$tenant = (string) config('services.todopago.tenant');

$bodyCandidates = [
    [],
    ['commerceID' => $commerceId, 'terminalID' => $terminalId],
    ['commerceId' => $commerceId, 'terminalId' => $terminalId],
    ['customerWalletID' => 0, 'commerceID' => $commerceId, 'terminalID' => $terminalId],
];

foreach ($bodyCandidates as $i => $body) {
    echo 'Trying body #'.$i.': '.json_encode($body).PHP_EOL;
    try {
        $res = Http::baseUrl($baseUrl)
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->withHeaders([
                'X-Tenant' => $tenant,
                'X-Token' => $token,
                'X-Content' => 'json',
            ])
            ->post($path, $body);

        if (! $res->successful()) {
            echo 'FAIL: HTTP '.$res->status().' '.$res->body().PHP_EOL;

            continue;
        }

        echo "OK\n";
        echo json_encode($res->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
        exit(0);
    } catch (Throwable $e) {
        echo 'FAIL: '.$e->getMessage().PHP_EOL;
    }
}

exit(1);
