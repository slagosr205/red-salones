<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('kind'); // Producto, Capacitacion
            $table->integer('points_cost');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('benefit_id')->constrained()->cascadeOnDelete();
            $table->integer('points_cost');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redemptions');
        Schema::dropIfExists('benefits');
    }
};
