<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;

// Local smoketest for TodoPago connectivity (no secrets printed).

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

echo 'base_url='.config('services.todopago.base_url').PHP_EOL;
echo 'login_path='.config('services.todopago.login_path').PHP_EOL;
echo 'payment_path='.config('services.todopago.payment_path').PHP_EOL;
echo 'tenant='.(config('services.todopago.tenant') ?: '(empty)').PHP_EOL;

try {
    $login = $client->login();
    $token = $login['token'];
    $masked = strlen($token) <= 8
        ? '********'
        : str_repeat('*', max(0, strlen($token) - 6)).substr($token, -6);

    echo 'LOGIN_OK'.PHP_EOL;
    echo 'token='.$masked.PHP_EOL;
    echo 'expiration='.(($login['expiration']) ? $login['expiration']->format('d/m/Y H:i:s') : 'null').PHP_EOL;
} catch (Throwable $e) {
    echo 'LOGIN_FAIL: '.$e->getMessage().PHP_EOL;
    exit(1);
}
