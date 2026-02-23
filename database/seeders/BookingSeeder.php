<?php

namespace Database\Seeders;

use App\Models\Bookings;
use App\Models\Guests;
use App\Models\Hotels;
use App\Models\Rooms;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $guestIds = Guests::query()->pluck('id');
        $hotels = Hotels::all();

        if ($guestIds->isEmpty() || $hotels->isEmpty()) {
            throw new \RuntimeException('Guests eller Hotels mangler. Kør de tidligere seeders først.');
        }

        // Cache rooms pr. hotel (hurtigere end query hver gang)
        $roomIdsByHotel = Rooms::query()
            ->select('id', 'hotels_id')
            ->get()
            ->groupBy('hotels_id')
            ->map(fn ($rows) => $rows->pluck('id')->values());

        $targetBookings = 120;
        $createdBookings = 0;

        // TODO: Indsæt enum her (når BookingStatus enum er lavet)
        $statuses = [0, 1, 2]; // fx 0=pending, 1=confirmed, 2=cancelled

        for ($i = 0; $i < $targetBookings; $i++) {
            $createdThisRound = false;

            // Flere forsøg for at finde ledige rum/tid uden overlap
            for ($attempt = 0; $attempt < 40; $attempt++) {
                $hotel = $hotels->random();

                $hotelRoomIds = $roomIdsByHotel->get($hotel->id, collect());
                if ($hotelRoomIds->isEmpty()) {
                    continue;
                }

                // Check-in/check-out tider
                $start = Carbon::now()
                    ->startOfDay()
                    ->addDays(rand(-30, 90))
                    ->setTime(14, 0);

                $end = (clone $start)
                    ->addDays(rand(1, 7))
                    ->setTime(11, 0);

                // Find rum i det hotel der er optaget i perioden (overlap)
                $occupiedRoomIds = Rooms::query()
                    ->where('hotels_id', $hotel->id)
                    ->whereHas('bookings', function ($q) use ($start, $end) {
                        $q->where('start', '<', $end)
                            ->where('end', '>', $start);
                    })
                    ->pluck('id');

                $availableRoomIds = $hotelRoomIds
                    ->diff($occupiedRoomIds)
                    ->values();

                if ($availableRoomIds->isEmpty()) {
                    continue;
                }

                $roomsToAttachCount = rand(1, min(3, $availableRoomIds->count()));
                $selectedRoomIds = $availableRoomIds
                    ->shuffle()
                    ->take($roomsToAttachCount)
                    ->values()
                    ->all();

                $booking = Bookings::factory()->create([
                    'start' => $start,
                    'end' => $end,
                    'status' => $statuses[array_rand($statuses)],
                ]);

                $booking->rooms()->sync($selectedRoomIds);

                $guestCount = rand(1, min(4, $guestIds->count()));
                $selectedGuestIds = $guestIds
                    ->shuffle()
                    ->take($guestCount)
                    ->values()
                    ->all();

                $booking->guests()->sync($selectedGuestIds);

                $createdBookings++;
                $createdThisRound = true;
                break;
            }

            if (! $createdThisRound) {
                // Hvis der ikke kunne findes plads, skipper vi bare én booking
                // (kan ske hvis kapaciteten bliver presset)
                $this->command?->warn("Booking #{$i} kunne ikke oprettes uden overlap.");
            }
        }
    }
}
