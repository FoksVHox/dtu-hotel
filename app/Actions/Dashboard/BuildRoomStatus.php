<?php

namespace App\Actions\Dashboard;

use App\Enums\BookingStatus;
use App\Models\Room;
use Carbon\Carbon;

class BuildRoomStatus
{
    /**
     * @return array{totalRooms: int, occupied: int, available: int, maintenance: int, checkedOutToday: int, occupiedPercent: int, availablePercent: int, maintenancePercent: int}
     */
    public function __invoke(): array
    {
        $today = Carbon::today();
        $todayEnd = $today->copy()->endOfDay();

        $totalRooms = Room::query()->count();

        $occupied = Room::query()
            ->whereHas('bookings', fn ($q) => $q
                ->where('status', BookingStatus::CheckedIn)
                ->where('start', '<=', $todayEnd)
                ->where('end', '>=', $today)
            )
            ->count();

        $maintenance = Room::query()
            ->whereHas('bookings', fn ($q) => $q
                ->where('status', BookingStatus::Maintenance)
                ->where('start', '<=', $todayEnd)
                ->where('end', '>=', $today)
            )
            ->count();

        $available = max(0, $totalRooms - $occupied - $maintenance);

        $checkedOutToday = Room::query()
            ->whereHas('bookings', fn ($q) => $q
                ->where('status', BookingStatus::CheckedOut)
                ->whereDate('end', $today)
            )
            ->count();

        $pct = fn (int $count): int => $totalRooms > 0
            ? (int) round(($count / $totalRooms) * 100)
            : 0;

        return [
            'totalRooms' => $totalRooms,
            'occupied' => $occupied,
            'available' => $available,
            'maintenance' => $maintenance,
            'checkedOutToday' => $checkedOutToday,
            'occupiedPercent' => $pct($occupied),
            'availablePercent' => $pct($available),
            'maintenancePercent' => $pct($maintenance),
        ];
    }
}
