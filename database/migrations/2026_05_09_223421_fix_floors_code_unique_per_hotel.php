<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('floors', function (Blueprint $table): void {
            $table->dropUnique('floors_code_unique');
            $table->unique(['hotel_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::table('floors', function (Blueprint $table): void {
            $table->dropUnique(['hotel_id', 'code']);
            $table->unique('code');
        });
    }
};
