<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('benefits', function (Blueprint $table) {
            $table->string('instructor')->nullable()->after('description');
            $table->date('date')->nullable()->after('instructor');
            $table->string('modality')->nullable()->after('date');
            $table->unsignedInteger('seats')->nullable()->after('modality');
        });
    }

    public function down(): void
    {
        Schema::table('benefits', function (Blueprint $table) {
            $table->dropColumn(['instructor', 'date', 'modality', 'seats']);
        });
    }
};
