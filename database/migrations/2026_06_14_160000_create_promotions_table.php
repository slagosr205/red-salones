<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // 2x1, descuento, combo
            $table->decimal('value', 5, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('article_promotion', function (Blueprint $table) {
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->primary(['article_id', 'promotion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_promotion');
        Schema::dropIfExists('promotions');
    }
};
