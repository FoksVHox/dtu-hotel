<?php

namespace App\Actions\Dashboard;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;

class BuildTodayActivity
{
    /**
     * Build today's activity statistics for the dashboard.
     *
     * Counts today's check-ins, check-outs, currently checked-in bookings,
     * expected occupancy percentage, and pending confirmations.
     *
     * @return array{checkInsToday: int, checkOutsToday: int, currentlyCheckedIn: int, expectedOccupancy: int, pendingConfirmations: int}
     */
    public function __invoke(): array
    {
        $today = Carbon::today();
        $todayEnd = $today->copy()->endOfDay();

        $checkInsToday = Booking::query()
            ->whereDate('start', $today)
            ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn])
            ->count();

        $checkOutsToday = Booking::query()
            ->whereDate('end', $today)
            ->whereIn('status', [BookingStatus::CheckedIn, BookingStatus::CheckedOut])
            ->count();

        $currentlyCheckedIn = Booking::query()
            ->where('status', BookingStatus::CheckedIn)
            ->where('start', '<=', $todayEnd)
            ->where('end', '>=', $today)
            ->count();

        $totalRooms = Room::query()->count();
        $occupiedRooms = Room::query()
            ->whereHas('bookings', fn ($q) => $q
                ->where('start', '<=', $todayEnd)
                ->where('end', '>=', $today)
                ->whereNotIn('status', [BookingStatus::Cancelled, BookingStatus::Maintenance])
            )
            ->count();

        $expectedOccupancy = $totalRooms > 0
            ? (int) round(($occupiedRooms / $totalRooms) * 100)
            : 0;

        $pendingConfirmations = Booking::query()
            ->where('status', BookingStatus::Pending)
            ->count();

        return [
            'checkInsToday' => $checkInsToday,
            'checkOutsToday' => $checkOutsToday,
            'currentlyCheckedIn' => $currentlyCheckedIn,
            'expectedOccupancy' => $expectedOccupancy,
            'pendingConfirmations' => $pendingConfirmations,
        ];
    }
}
