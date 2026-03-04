<?php

use App\Models\Room;
use App\Models\RoomAccessory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_accessory_room', function (Blueprint $table) {
            $table->foreignIdFor(RoomAccessory::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Room::class)->constrained()->cascadeOnDelete();

            $table->primary(['room_accessory_id', 'room_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_accessory_room');
    }
};
