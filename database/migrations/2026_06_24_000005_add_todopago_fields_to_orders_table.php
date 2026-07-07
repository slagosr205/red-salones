<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('todopago_transaccion_id', 50)->nullable()->after('stripe_payment_intent_id');
            $table->string('todopago_response_code', 20)->nullable()->after('todopago_transaccion_id');
            $table->string('todopago_response_message', 255)->nullable()->after('todopago_response_code');
            $table->string('todopago_card_number_masked', 20)->nullable()->after('todopago_response_message');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'todopago_transaccion_id',
                'todopago_response_code',
                'todopago_response_message',
                'todopago_card_number_masked',
            ]);
        });
    }
};
