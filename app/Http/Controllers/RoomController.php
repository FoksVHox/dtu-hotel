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
        $rooms = Room::with(['floor.building', 'roomCategory'])
            ->orderBy('id')
            ->get();

        $categories = RoomCategory::orderBy('name')->get(['id', 'name']);

        $floors = Floor::with('building')->orderBy('building_id')->orderBy('name')->get()
            ->map(fn (Floor $floor) => [
                'id' => $floor->id,
                'label' => $floor->building->name.' — '.$floor->name,
                'building_name' => $floor->building->name,
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
            'code' => $validated['code'] ?? null,
            'status' => isset($validated['status']) ? RoomStatus::from($validated['status']) : RoomStatus::Available,
        ]);

        return to_route('rooms.index');
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
            $floor = Floor::findOrFail($validated['floor_id']);
            $room->update([
                'floor_id' => $floor->id,
                'building_id' => $floor->building_id,
            ]);
        }

        if (array_key_exists('manual_status', $validated)) {
            $room->update(['manual_status' => $validated['manual_status']]);
        }

        if (array_key_exists('code', $validated)) {
            $room->update(['code' => $validated['code']]);
        }

        return to_route('rooms.index');
    }

    public function destroy(string $id): void {}
}
