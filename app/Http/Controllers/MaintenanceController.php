<?php

namespace App\Http\Controllers;

use App\Enums\RoomStatus;
use App\Models\Floor;
use App\Models\MaintenanceLog;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $rooms = Room::with([
            'floor.building',
            'roomCategory',
            'maintenanceLogs' => fn ($q) => $q->latest('performed_at')->limit(10),
        ])
            ->whereIn('status', [RoomStatus::Cleaning, RoomStatus::OutOfOrder])
            ->orderBy('id')
            ->get()
            ->map(fn (Room $room) => [
                'id' => $room->id,
                'code' => $room->code,
                'status' => $room->status->value,
                'scheduled_cleaning_at' => $room->scheduled_cleaning_at?->toIso8601String(),
                'floor_id' => $room->floor_id,
                'floor' => [
                    'id' => $room->floor->id,
                    'name' => $room->floor->name,
                    'building' => ['name' => $room->floor->building->name],
                ],
                'room_category' => ['name' => $room->roomCategory?->name ?? ''],
                'maintenance_logs' => $room->maintenanceLogs->map(fn (MaintenanceLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'maintained_by' => $log->maintained_by,
                    'performed_at' => $log->performed_at->toIso8601String(),
                ]),
            ]);

        $allRooms = Room::with(['floor.building', 'roomCategory'])
            ->orderBy('id')
            ->get()
            ->map(fn (Room $room) => [
                'id' => $room->id,
                'code' => $room->code,
                'floor' => [
                    'name' => $room->floor->name,
                    'building' => ['name' => $room->floor->building->name],
                ],
                'room_category' => ['name' => $room->roomCategory?->name ?? ''],
            ]);

        $floors = Floor::with('building')
            ->orderBy('building_id')
            ->orderBy('name')
            ->get()
            ->map(fn (Floor $floor) => [
                'id' => $floor->id,
                'label' => $floor->building->name.' — '.$floor->name,
                'building_name' => $floor->building->name,
            ]);

        $recentLogs = MaintenanceLog::with(['room.floor.building'])
            ->latest('performed_at')
            ->limit(10)
            ->get()
            ->map(fn (MaintenanceLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'maintained_by' => $log->maintained_by,
                'performed_at' => $log->performed_at->toIso8601String(),
                'room' => [
                    'code' => $log->room->code,
                    'floor' => [
                        'name' => $log->room->floor->name,
                        'building' => ['name' => $log->room->floor->building->name],
                    ],
                ],
            ]);

        $stats = [
            'cleaning' => Room::where('status', RoomStatus::Cleaning)->count(),
            'out_of_order' => Room::where('status', RoomStatus::OutOfOrder)->count(),
            'scheduled' => Room::whereNotNull('scheduled_cleaning_at')->count(),
            'logs_today' => MaintenanceLog::whereDate('performed_at', today())->count(),
            'logs_this_week' => MaintenanceLog::whereBetween('performed_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'total_logs' => MaintenanceLog::count(),
        ];

        return Inertia::render('maintenance/index', [
            'rooms' => $rooms,
            'cleaningRooms' => $rooms->filter(fn ($room) => $room['status'] === RoomStatus::Cleaning->value)->values(),
            'allRooms' => $allRooms,
            'floors' => $floors,
            'stats' => $stats,
            'recentLogs' => $recentLogs,
        ]);
    }
}
