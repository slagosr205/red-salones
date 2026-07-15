<?php

use App\Models\Order;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$orders = Order::latest()->limit(5)->get([
    'id', 'order_number', 'shipping_address',
    'shipping_latitude', 'shipping_longitude', 'created_at',
]);

foreach ($orders as $o) {
    echo json_encode($o->toArray(), JSON_PRETTY_PRINT)."\n---\n";
}
