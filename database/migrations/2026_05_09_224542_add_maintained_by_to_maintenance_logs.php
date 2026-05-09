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
        Schema::table('maintenance_logs', function (Blueprint $table): void {
            $table->string('maintained_by')->nullable()->after('action');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_logs', function (Blueprint $table): void {
            $table->dropColumn('maintained_by');
        });
    }
};
