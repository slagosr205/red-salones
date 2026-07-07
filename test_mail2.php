<?php

use App\Mail\AffiliateCardMail;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Mail;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

try {
    $user = User::find(5);
    if (! $user) {
        echo "User 5 not found\n";
        exit;
    }

    $member = [
        'name' => mb_strtoupper($user->name),
        'id' => 'RC-'.$user->created_at->format('Y').'-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
        'level' => 'PLATINUM',
        'since' => ucfirst($user->created_at->format('F Y')),
        'expires' => ucfirst((clone $user->created_at)->addYear()->format('F Y')),
    ];

    Mail::to($user->email)->send(new AffiliateCardMail($user, $member));
    echo "AffiliateCardMail sent to {$user->email}\n";
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
    echo get_class($e)."\n";
    echo $e->getTraceAsString()."\n";
}
