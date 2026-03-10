<?php

namespace App\Actions\Dashboard;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;

class BuildBookingPipeline
{
    /**
     * Build booking pipeline statistics for the dashboard.
     *
     * Counts active bookings for the current and next week, pending confirmations,
     * cancellations this week, and computes occupancy percentages for trend comparison.
     *
     * @return array{thisWeekBookings: int, nextWeekBookings: int, pendingConfirmations: int, cancelledThisWeek: int, occupancyThisWeek: int, occupancyLastWeek: int}
     */
    public function __invoke(): array
    {
        $thisWeekStart = Carbon::now()->startOfWeek();
        $thisWeekEnd = Carbon::now()->endOfWeek()->endOfDay();
        $nextWeekStart = $thisWeekStart->copy()->addWeek();
        $nextWeekEnd = $thisWeekEnd->copy()->addWeek();
        $lastWeekStart = $thisWeekStart->copy()->subWeek();
        $lastWeekEnd = $thisWeekStart->copy()->subSecond();

        $excludedStatuses = [BookingStatus::Cancelled, BookingStatus::Maintenance];

        $thisWeekBookings = Booking::query()
            ->where('start', '<=', $thisWeekEnd)
            ->where('end', '>=', $thisWeekStart)
            ->whereNotIn('status', $excludedStatuses)
            ->count();

        $nextWeekBookings = Booking::query()
            ->where('start', '<=', $nextWeekEnd)
            ->where('end', '>=', $nextWeekStart)
            ->whereNotIn('status', $excludedStatuses)
            ->count();

        $pendingConfirmations = Booking::query()
            ->where('status', BookingStatus::Pending)
            ->count();

        $cancelledThisWeek = Booking::query()
            ->where('status', BookingStatus::Cancelled)
            ->where('start', '>=', $thisWeekStart)
            ->where('start', '<=', $thisWeekEnd)
            ->count();

        $totalRooms = Room::query()->count();

        $occupancyThisWeek = $this->calculateWeeklyOccupancy($totalRooms, $thisWeekStart, $thisWeekEnd);
        $occupancyLastWeek = $this->calculateWeeklyOccupancy($totalRooms, $lastWeekStart, $lastWeekEnd);

        return [
            'thisWeekBookings' => $thisWeekBookings,
            'nextWeekBookings' => $nextWeekBookings,
            'pendingConfirmations' => $pendingConfirmations,
            'cancelledThisWeek' => $cancelledThisWeek,
            'occupancyThisWeek' => $occupancyThisWeek,
            'occupancyLastWeek' => $occupancyLastWeek,
        ];
    }

    /**
     * Calculate the percentage of rooms with at least one active booking overlapping the given week.
     *
     * Active means any status except Cancelled and Maintenance.
     *
     * @return int Occupancy percentage (0–100).
     */
    private function calculateWeeklyOccupancy(int $totalRooms, Carbon $weekStart, Carbon $weekEnd): int
    {
        if ($totalRooms === 0) {
            return 0;
        }

        $occupiedRooms = Room::query()
            ->whereHas('bookings', fn ($q) => $q
                ->where('start', '<=', $weekEnd)
                ->where('end', '>=', $weekStart)
                ->whereNotIn('status', [BookingStatus::Cancelled, BookingStatus::Maintenance])
            )
            ->count();

        return (int) round(($occupiedRooms / $totalRooms) * 100);
    }
}
