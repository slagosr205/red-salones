<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leader_zone', function (Blueprint $table) {
            $table->foreignId('leader_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('zone_id')->constrained('zones')->cascadeOnDelete();
            $table->primary(['leader_id', 'zone_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leader_zone');
    }
};
