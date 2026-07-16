<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$url = rtrim(trim(Config::get('services.todopago.base_url')), '/').'/login';
$payload = [
    'user' => trim((string) Config::get('services.todopago.user')),
    'password' => (string) Config::get('services.todopago.password'),
    'userType' => (string) Config::get('services.todopago.user_type', '2'),
];

echo "URL: $url\n";
echo 'Payload: '.json_encode($payload)."\n";
echo 'Tenant: '.Config::get('services.todopago.tenant', 'HNTP')."\n\n";

$response = Http::withHeaders([
    'Accept' => 'application/json, text/plain, */*',
    'X-Content' => 'json',
    'X-Tenant' => Config::get('services.todopago.tenant', 'HNTP'),
])
    ->withOptions([
        'allow_redirects' => false,
        'http_errors' => false,
    ])
    ->withBody(
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'application/json; charset=UTF-8'
    )
    ->post($url);

echo 'Status: '.$response->status()."\n";
echo 'Location header: '.($response->header('Location')[0] ?? 'N/A')."\n";
echo 'Allow header: '.($response->header('Allow')[0] ?? 'N/A')."\n\n";
echo "Body:\n".$response->body()."\n";
