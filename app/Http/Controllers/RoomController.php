<?php

namespace App\Http\Controllers;

use App\Enums\RoomStatus;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\MaintenanceLog;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function index(): Response
    {
        $today = now();

        $rooms = Room::with([
            'floor',
            'roomCategory',
            'bookings' => fn ($q) => $q->orderBy('start'),
        ])
            ->get()
            ->map(function (Room $room) use ($today) {
                $booking = $room->bookings->first(fn ($b) => $b->start <= $today && $b->end >= $today)
                    ?? $room->bookings->first(fn ($b) => $b->start > $today)
                    ?? $room->bookings->last();

                return [
                    'id' => $room->id,
                    'code' => $room->floor->name.'-'.$room->id,
                    'category' => $room->roomCategory->name,
                    'floor' => (int) filter_var($room->floor->name, FILTER_SANITIZE_NUMBER_INT),
                    'status' => $room->status->value,
                    'booking_status' => $booking?->status->value,
                    'scheduled_cleaning_at' => $room->scheduled_cleaning_at?->toIso8601String(),
                ];
            });

        return Inertia::render('rooms/index', ['rooms' => $rooms]);
    }

    public function create(): void {}

    public function store(): void {}

    public function show(string $id): void {}

    public function edit(string $id): void {}

    public function update(UpdateRoomRequest $request, Room $room): RedirectResponse
    {
        $validated = $request->validated();

        if (isset($validated['status'])) {
            $newStatus = RoomStatus::from($validated['status']);

            if ($newStatus === RoomStatus::Available && $room->status === RoomStatus::Cleaning) {
                MaintenanceLog::query()->create([
                    'room_id' => $room->id,
                    'action' => 'cleaned',
                    'performed_at' => now(),
                ]);
            }

            $room->update(['status' => $newStatus]);
        }

        if (array_key_exists('scheduled_cleaning_at', $validated)) {
            $room->update(['scheduled_cleaning_at' => $validated['scheduled_cleaning_at']]);
        }

        return redirect()->back();
    }

    public function destroy(string $id): void {}
}
