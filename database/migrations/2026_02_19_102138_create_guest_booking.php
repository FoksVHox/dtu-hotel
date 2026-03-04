<?php

use App\Models\Booking;
use App\Models\Guest;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_booking', function (Blueprint $table) {
            $table->foreignIdFor(Guest::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Booking::class)->constrained()->cascadeOnDelete();

            $table->primary(['guest_id', 'booking_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_booking');
    }
};
