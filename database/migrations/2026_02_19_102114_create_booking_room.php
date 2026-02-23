<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('booking_room', function (Blueprint $table) {
            $table->foreignId('bookings_id');
            $table->foreignId('rooms_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_room');
    }
};
