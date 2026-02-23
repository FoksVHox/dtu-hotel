<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('room_accessory_room', function (Blueprint $table) {
            $table->foreignId('room_accessory_id');
            $table->foreignId('rooms_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_accessory_room');
    }
};
