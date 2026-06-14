<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('salon_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('order_number', 30)->unique();
            $table->string('status', 20)->default('packaging');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('total_discount', 10, 2)->default(0);
            $table->decimal('isv', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2)->default(0);
            $table->integer('points_earned')->default(0);
            $table->string('payment_method', 30)->nullable();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('product_name');
            $table->string('product_id')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->string('promo_type', 20)->nullable();
            $table->decimal('subtotal', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
