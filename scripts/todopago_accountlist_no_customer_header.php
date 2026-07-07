<?php

use App\Services\TodoPagoClient;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** @var TodoPagoClient $client */
$client = $app->make(TodoPagoClient::class);

$token = $client->getToken();
$baseUrl = (string) config('services.todopago.base_url');
$path = (string) config('services.todopago.account_list_path');
$tenant = (string) config('services.todopago.tenant');

$res = Http::baseUrl($baseUrl)
    ->acceptJson()
    ->asJson()
    ->timeout(20)
    ->withHeaders([
        'X-Tenant' => $tenant,
        'X-Token' => $token,
        'X-Content' => 'json',
    ])
    ->get($path);

echo 'HTTP '.$res->status().PHP_EOL;
echo ($res->body() ?: '(empty)').PHP_EOL;
