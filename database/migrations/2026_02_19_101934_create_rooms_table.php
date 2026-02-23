<?php

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\RoomCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Hotel::class);
            $table->foreignIdFor(Building::class);
            $table->foreignIdFor(Floor::class);
            $table->foreignIdFor(RoomCategory::class);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
