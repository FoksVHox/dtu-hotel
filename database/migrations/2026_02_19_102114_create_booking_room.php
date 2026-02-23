<?php

use App\Models\Booking;
use App\Models\Room;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_room', function (Blueprint $table) {
            $table->foreignIdFor(Booking::class);
            $table->foreignIdFor(Room::class);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_room');
    }
};
