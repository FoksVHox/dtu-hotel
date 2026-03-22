<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Models\Booking;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomCategory;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HousekeepingSeeder extends Seeder
{
    public function run(): void
    {
        $hotel = Hotel::factory()->create([
            'name' => 'DTU Test Hotel',
            'cvr' => '11223344',
            'phone' => '+45 11223344',
            'email' => 'test@dtuhotel.test',
            'domain' => 'dtuhotel.test',
            'address' => 'Anker Engelunds Vej 1, 2800 Kongens Lyngby',
            'currency' => 'DKK',
        ]);

        $building = Building::factory()->create([
            'hotel_id' => $hotel->id,
            'name' => 'Main Building',
            'code' => 'A',
            'address' => $hotel->address,
            'phone' => $hotel->phone,
        ]);

        $floors = collect([1, 2, 3])->map(fn (int $n) => Floor::factory()->create([
            'hotel_id' => $hotel->id,
            'building_id' => $building->id,
            'name' => "Floor {$n}",
            'code' => (string) $n,
        ]));

        $category = RoomCategory::first() ?? RoomCategory::factory()->create(['name' => 'Standard']);

        $guest = Guest::first() ?? Guest::factory()->create();

        // ── Available rooms (one per floor) ──────────────────────────────────
        foreach ($floors as $floor) {
            Room::factory()->create([
                'hotel_id' => $hotel->id,
                'building_id' => $building->id,
                'floor_id' => $floor->id,
                'room_category_id' => $category->id,
                'status' => RoomStatus::Available,
            ]);
        }

        // ── Occupied rooms with CheckedIn bookings ────────────────────────────
        foreach ($floors->take(2) as $floor) {
            $room = Room::factory()->create([
                'hotel_id' => $hotel->id,
                'building_id' => $building->id,
                'floor_id' => $floor->id,
                'room_category_id' => $category->id,
                'status' => RoomStatus::Occupied,
            ]);

            $booking = Booking::factory()->create([
                'start' => Carbon::now()->subDay()->setTime(14, 0),
                'end' => Carbon::now()->addDays(2)->setTime(11, 0),
                'status' => BookingStatus::CheckedIn,
            ]);

            $booking->rooms()->attach($room);
            $booking->guests()->attach($guest);
        }

        // ── Cleaning rooms with CheckedOut bookings ───────────────────────────
        $scenarios = [
            ['checked_out_hours_ago' => 3,  'scheduled_in_hours' => 1],
            ['checked_out_hours_ago' => 6,  'scheduled_in_hours' => null],
            ['checked_out_hours_ago' => 12, 'scheduled_in_hours' => 3],
        ];

        foreach ($floors as $i => $floor) {
            $scenario = $scenarios[$i] ?? ['checked_out_hours_ago' => 1, 'scheduled_in_hours' => null];

            $room = Room::factory()->create([
                'hotel_id' => $hotel->id,
                'building_id' => $building->id,
                'floor_id' => $floor->id,
                'room_category_id' => $category->id,
                'status' => RoomStatus::Cleaning,
                'scheduled_cleaning_at' => $scenario['scheduled_in_hours'] !== null
                    ? Carbon::now()->addHours($scenario['scheduled_in_hours'])
                    : null,
            ]);

            $booking = Booking::factory()->create([
                'start' => Carbon::now()->subDays(3)->setTime(14, 0),
                'end' => Carbon::now()->subHours($scenario['checked_out_hours_ago'])->setTime(11, 0),
                'status' => BookingStatus::CheckedOut,
            ]);

            $booking->rooms()->attach($room);
            $booking->guests()->attach($guest);
        }
    }
}
