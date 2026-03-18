<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function index(): Response
    {
        $rooms = Room::query()
            ->with([
                'roomCategory',
                'floor',
                'bookings' => fn ($query) => $query
                    ->whereIn('status', array_column(BookingStatus::cases(), 'value'))
                    ->orderByDesc('start')
                    ->orderByDesc('id'),
            ])
            ->get()
            ->map(function (Room $room): array {
                $status = $this->resolveRoomStatus($room->bookings);

                return [
                    ...$room->toArray(),
                    'status' => $status->value,
                ];
            });

        return Inertia::render('rooms/index', [
            'rooms' => $rooms,

        ]);
    }

    private function resolveRoomStatus(Collection $bookings): BookingStatus
    {
        if ($bookings->isEmpty()) {
            return BookingStatus::Unknown;
        }

        /** @var Booking|null $latestBooking */
        $latestBooking = $bookings
            ->sortByDesc(fn (Booking $booking): int => $booking->start?->getTimestamp() ?? 0)
            ->first();

        return $latestBooking?->status ?? BookingStatus::Unknown;
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
