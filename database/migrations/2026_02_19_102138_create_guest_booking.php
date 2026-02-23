<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_booking', function (Blueprint $table) {
            $table->foreignId('guest_id');
            $table->foreignId('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_booking');
    }
};
