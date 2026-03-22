<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $cleaningRooms = Room::query()
            ->where('status', RoomStatus::Cleaning)
            ->with([
                'building',
                'floor',
                'bookings' => fn ($q) => $q
                    ->where('status', BookingStatus::CheckedOut)
                    ->latest('end')
                    ->limit(1),
            ])
            ->get()
            ->map(fn (Room $room) => [
                'id' => $room->id,
                'code' => $room->building->code.'-'.$room->floor->name.'-'.$room->id,
                'floor' => (int) filter_var($room->floor->name, FILTER_SANITIZE_NUMBER_INT),
                'checked_out_at' => $room->bookings->first()?->end?->toIso8601String(),
                'scheduled_cleaning_at' => $room->scheduled_cleaning_at?->toIso8601String(),
            ]);

        return Inertia::render('maintenance/index', [
            'cleaningRooms' => $cleaningRooms,
        ]);
    }
}
