<?php

use App\Models\Hotel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
            $table->timestamp('onboarded_at')->nullable()->after('email_verified_at');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('guests', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('maintenance_logs', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // Backfill bookings.hotel_id via booking_room → rooms.hotel_id
        DB::statement('
            UPDATE bookings
            SET hotel_id = r.hotel_id
            FROM booking_room br
            INNER JOIN rooms r ON r.id = br.room_id
            WHERE bookings.id = br.booking_id
              AND bookings.hotel_id IS NULL
              AND r.hotel_id IS NOT NULL
        ');

        // Backfill guests.hotel_id via guest_booking → bookings.hotel_id
        DB::statement('
            UPDATE guests
            SET hotel_id = b.hotel_id
            FROM guest_booking gb
            INNER JOIN bookings b ON b.id = gb.booking_id
            WHERE guests.id = gb.guest_id
              AND guests.hotel_id IS NULL
              AND b.hotel_id IS NOT NULL
        ');

        // Backfill maintenance_logs.hotel_id via room.hotel_id
        DB::statement('
            UPDATE maintenance_logs
            SET hotel_id = r.hotel_id
            FROM rooms r
            WHERE maintenance_logs.room_id = r.id
              AND maintenance_logs.hotel_id IS NULL
              AND r.hotel_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        Schema::table('maintenance_logs', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
        });

        Schema::table('guests', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
            $table->dropColumn('onboarded_at');
        });
    }
};
