<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('todopago_reversal_status', 30)->nullable()->after('todopago_card_number_masked');
            $table->text('todopago_reversal_response')->nullable()->after('todopago_reversal_status');
            $table->timestamp('todopago_reversed_at')->nullable()->after('todopago_reversal_response');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'todopago_reversal_status',
                'todopago_reversal_response',
                'todopago_reversed_at',
            ]);
        });
    }
};
