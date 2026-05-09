<?php

namespace App\Http\Controllers;

use App\Enums\RoomStatus;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Floor;
use App\Models\MaintenanceLog;
use App\Models\Room;
use App\Models\RoomCategory;
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
                    'room_category_id' => $room->room_category_id,
                    'floor_id' => $room->floor_id,
                    'manual_status' => $room->manual_status?->value,
                    'scheduled_cleaning_at' => $room->scheduled_cleaning_at?->toIso8601String(),
                ];
            });

        $categories = RoomCategory::orderBy('name')->get(['id', 'name']);

        $floors = Floor::with('building')->orderBy('building_id')->orderBy('name')->get()
            ->map(fn (Floor $floor) => [
                'id' => $floor->id,
                'label' => $floor->building->name.' — '.$floor->name,
            ]);

        return Inertia::render('rooms/index', [
            'rooms' => $rooms,
            'categories' => $categories,
            'floors' => $floors,
        ]);
    }

    public function create(): void {}

    public function store(StoreRoomRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $floor = Floor::findOrFail($validated['floor_id']);

        Room::create([
            'hotel_id' => $floor->hotel_id,
            'building_id' => $floor->building_id,
            'floor_id' => $floor->id,
            'room_category_id' => $validated['room_category_id'],
            'status' => RoomStatus::Available,
            'manual_status' => $validated['manual_status'] ?? null,
        ]);

        return redirect()->back();
    }

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

        if (isset($validated['room_category_id'])) {
            $room->update(['room_category_id' => $validated['room_category_id']]);
        }

        if (isset($validated['floor_id'])) {
            $room->update(['floor_id' => $validated['floor_id']]);
        }

        if (array_key_exists('manual_status', $validated)) {
            $room->update(['manual_status' => $validated['manual_status']]);
        }

        return redirect()->back();
    }

    public function destroy(string $id): void {}
}
