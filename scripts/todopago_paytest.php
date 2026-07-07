<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

// Local pay test for TodoPago (no full PAN/token printed).
// Usage:
//   php scripts/todopago_paytest.php <amount> <currency> <tokenAccount|auto|direct> <customerWalletID> [customerID]
// Examples:
//   php scripts/todopago_paytest.php 1.00 HNL 4000000000000002      # pay with tokenAccount
//   php scripts/todopago_paytest.php 1.00 HNL direct               # direct payment (no tokenAccount needed)
//
// NOTE: If payment with tokenAccount fails with "la cuenta no es valida",
// use 'direct' mode instead which bypasses the tokenAccount requirement.

require __DIR__.'/../vendor/autoload.php';

$amount = $argv[1] ?? null;
$currency = $argv[2] ?? null;
$tokenAccount = $argv[3] ?? null;
$customerWalletId = $argv[4] ?? '0';
$customerId = $argv[5] ?? null;

if ($amount === null || $currency === null || $tokenAccount === null) {
    fwrite(STDERR, 'Usage: php scripts/todopago_paytest.php <amount> <currency> <tokenAccount|auto> <customerWalletID> [customerID]'.PHP_EOL);
    exit(2);
}

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

if (strtolower((string) $tokenAccount) === 'auto') {
    if (! is_string($customerId) || $customerId === '') {
        fwrite(STDERR, 'When tokenAccount=auto you must pass [customerID] as 5th argument.'.PHP_EOL);
        exit(2);
    }

    $list = $client->accountList($customerId, [], 'json');
    $accounts = data_get($list, 'data', []);
    if (! is_array($accounts) || $accounts === []) {
        fwrite(STDERR, 'No accounts found for customerID='.$customerId.PHP_EOL);
        exit(1);
    }

    $first = $accounts[0];
    if (! is_array($first)) {
        fwrite(STDERR, 'Unexpected account-list data shape.'.PHP_EOL);
        exit(1);
    }

    $tokenAccount = (string) (data_get($first, 'tokenAccount') ?? data_get($first, 'token_account') ?? '');
    $customerWalletId = (string) (data_get($first, 'customerWalletID') ?? data_get($first, 'customer_wallet_id') ?? $customerWalletId);

    if ($tokenAccount === '') {
        fwrite(STDERR, 'account-list did not include tokenAccount.'.PHP_EOL);
        exit(1);
    }
}

$maskedAccount = strlen($tokenAccount) <= 8
    ? '********'
    : str_repeat('*', max(0, strlen($tokenAccount) - 4)).substr($tokenAccount, -4);

echo 'base_url='.config('services.todopago.base_url').PHP_EOL;
echo 'payment_path='.config('services.todopago.payment_path').PHP_EOL;
echo 'tenant='.(config('services.todopago.tenant') ?: '(empty)').PHP_EOL;
echo 'amount='.$amount.' '.$currency.PHP_EOL;
echo 'tokenAccount='.$maskedAccount.PHP_EOL;

$payload = [
    'amount' => (float) $amount,
    'currency' => (string) $currency,
    'tokenAccount' => (string) $tokenAccount,
    // Some accounts require a wallet id even in test.
    'customerWalletID' => (int) $customerWalletId,
    'billerID' => 0,
    'externalReference' => 'rc-'.date('Ymd-His'),
    'comment' => 'RC test payment',
    'ipAddress' => '127.0.0.1',
    'taxes' => 0,
    'tips' => 0,
];

try {
    $resp = $client->pay($payload, contentMode: 'json');
    echo json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $e) {
    echo 'PAY_FAIL: '.$e->getMessage().PHP_EOL;
    exit(1);
}
