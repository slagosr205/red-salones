<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Mail;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

try {
    Mail::raw('Test desde la app', function ($msg) {
        $msg->to('info@probeautyhn.com')->subject('Test');
    });
    echo "OK\n";
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
    echo get_class($e)."\n";
}
