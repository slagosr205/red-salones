<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

// Full TodoPago payment flow: Customer Register -> Account Register -> Payment
//
// Usage:
//   php scripts/todopago_fullflow.php
//   php scripts/todopago_fullflow.php [customerID] [tokenAccount]
//   php scripts/todopago_fullflow.php auto [customerID]
//   php scripts/todopago_fullflow.php direct <customerName> <customerEmail> <identificationNumber>

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

echo 'base_url='.config('services.todopago.base_url').PHP_EOL;
echo 'tenant='.(config('services.todopago.tenant') ?: '(empty)').PHP_EOL;
echo PHP_EOL;

try {
    // --- Step 1: Login ---
    echo '--- Step 1: Login ---'.PHP_EOL;
    $login = $client->login();
    $masked = strlen($login['token']) <= 8
        ? '********'
        : str_repeat('*', max(0, strlen($login['token']) - 6)).substr($login['token'], -6);
    echo 'Login OK, token='.$masked.PHP_EOL.PHP_EOL;

    $mode = $argv[1] ?? 'full';

    // --- Step 2: Register customer (if needed) ---
    $customerId = null;
    $modeLower = strtolower($mode);

    if ($modeLower === 'full' || $modeLower === 'auto') {
        $customerId = isset($argv[2]) ? (int) $argv[2] : null;

        if ($customerId === null || $customerId <= 0) {
            echo '--- Step 2: Customer Registration ---'.PHP_EOL;
            $customerData = [
                'customerName' => 'Test User RC',
                'customerEmail' => 'test'.time().'@example.com',
                'cellPhone' => '50499999999',
                'identificationNumber' => '0801-2001-12345',
                'identificationTypeID' => 1,
                'birthDate' => '1990-01-01T00:00:00.000Z',
                'cityID' => 1,
            ];

            echo 'Registering customer: '.json_encode($customerData).PHP_EOL;
            $custResp = $client->customerRegister($customerData, 'json');
            echo 'Response: '.json_encode($custResp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;

            $customerId = (int) (data_get($custResp, 'data.customerID') ?? data_get($custResp, 'customerID') ?? 0);
            if ($customerId <= 0) {
                // Maybe returned in a different format
                $customerId = (int) (data_get($custResp, 'data') ?? 0);
            }
            echo 'Customer ID: '.$customerId.PHP_EOL.PHP_EOL;
        } else {
            echo '--- Step 2: Using provided customerID='.$customerId.' ---'.PHP_EOL.PHP_EOL;
        }

        // --- Step 3: Account Registration ---
        echo '--- Step 3: Account Registration ---'.PHP_EOL;
        $cardData = [
            'customerID' => $customerId,
            'accountNumber' => '4000000000000002',
            'cardHolderName' => 'Test User',
            'expirationMonth' => '12',
            'expirationYear' => '28',
            'cvc' => '123',
        ];

        echo 'Registering account: '.json_encode($cardData).PHP_EOL;
        try {
            $acctResp = $client->accountRegister($cardData, 'json');
            echo 'Response: '.json_encode($acctResp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;

            $tokenAccount = (string) (data_get($acctResp, 'data.tokenAccount') ?? data_get($acctResp, 'tokenAccount') ?? '');
            $customerWalletId = (int) (data_get($acctResp, 'data.customerWalletID') ?? data_get($acctResp, 'customerWalletID') ?? 0);

            echo 'tokenAccount='.$tokenAccount.PHP_EOL;
            echo 'customerWalletID='.$customerWalletId.PHP_EOL.PHP_EOL;

            if ($tokenAccount === '') {
                echo 'WARNING: No tokenAccount in response. Trying account-list...'.PHP_EOL;
                // Fall back to account-list
                $listResp = $client->accountList($customerId, [], 'json');
                echo 'account-list response: '.json_encode($listResp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
                $accounts = data_get($listResp, 'data', []);
                if (is_array($accounts) && count($accounts) > 0) {
                    $first = $accounts[0];
                    $tokenAccount = (string) (data_get($first, 'tokenAccount') ?? '');
                    $customerWalletId = (int) (data_get($first, 'customerWalletID') ?? 0);
                    echo 'From account-list: tokenAccount='.$tokenAccount.', customerWalletID='.$customerWalletId.PHP_EOL;
                }
            }
        } catch (Throwable $e) {
            echo 'Account register failed: '.$e->getMessage().PHP_EOL.PHP_EOL;
            // Try account-list as fallback
            echo 'Falling back to account-list...'.PHP_EOL;
            try {
                $listResp = $client->accountList($customerId, [], 'json');
                echo 'account-list response: '.json_encode($listResp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
                $accounts = data_get($listResp, 'data', []);
                if (is_array($accounts) && count($accounts) > 0) {
                    $first = $accounts[0];
                    $tokenAccount = (string) (data_get($first, 'tokenAccount') ?? '');
                    $customerWalletId = (int) (data_get($first, 'customerWalletID') ?? 0);
                    echo 'From account-list: tokenAccount='.$tokenAccount.', customerWalletID='.$customerWalletId.PHP_EOL;
                }
            } catch (Throwable $e2) {
                echo 'account-list also failed: '.$e2->getMessage().PHP_EOL;
                exit(1);
            }
        }

        if (empty($tokenAccount)) {
            echo 'ERROR: Could not obtain tokenAccount. Aborting.'.PHP_EOL;
            exit(1);
        }

        // --- Step 4: Payment ---
        echo '--- Step 4: Payment ---'.PHP_EOL;
        $payData = [
            'amount' => 1.00,
            'currency' => 'HNL',
            'tokenAccount' => $tokenAccount,
            'customerWalletID' => $customerWalletId,
            'billerID' => 0,
            'externalReference' => 'rc-'.date('Ymd-His'),
            'comment' => 'RC full-flow test payment',
            'ipAddress' => '127.0.0.1',
            'taxes' => 0,
            'tips' => 0,
        ];

        echo 'Payment payload: '.json_encode($payData).PHP_EOL;
        $payResp = $client->pay($payData, 'json');
        echo 'Response: '.json_encode($payResp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;

    } elseif ($modeLower === 'direct') {
        // Direct payment without account registration
        echo '--- Direct Payment (no tokenAccount needed) ---'.PHP_EOL;
        $customerName = $argv[2] ?? 'Test User';
        $customerEmail = $argv[3] ?? 'test@example.com';
        $identificationNumber = $argv[4] ?? '0801'.date('Ymd').'12345';
        $amount = isset($argv[5]) ? (float) $argv[5] : 1.00;

        $directData = [
            'accountNumber' => '4000000000000002',
            'cardHolderName' => $customerName,
            'expirationMonth' => '12',
            'expirationYear' => '28',
            'cvc' => '123',
            'amount' => $amount,
            'currency' => 'HNL',
            'customerName' => $customerName,
            'customerEmail' => $customerEmail,
            'identificationNumber' => $identificationNumber,
            'identificationTypeID' => 1,
            'externalReference' => 'rc-direct-'.date('Ymd-His'),
            'comment' => 'RC direct payment test',
            'ipAddress' => '127.0.0.1',
            'taxes' => 0,
            'tips' => 0,
        ];

        echo 'Direct payment payload: '.json_encode($directData).PHP_EOL;
        $resp = $client->directPayment($directData, 'json');
        echo 'Response: '.json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
    } else {
        echo 'Usage: php scripts/todopago_fullflow.php [auto|direct|customerID] [params...]'.PHP_EOL;
        echo '  (no args)       Full flow: register customer -> register card -> pay'.PHP_EOL;
        echo '  auto <customerID>     Use existing customerID, auto-get tokenAccount from account-list'.PHP_EOL;
        echo '  direct [name] [email] [ident]  Direct payment without account registration'.PHP_EOL;
        exit(2);
    }

} catch (Throwable $e) {
    echo 'FLOW_FAIL: '.$e->getMessage().PHP_EOL;
    exit(1);
}
