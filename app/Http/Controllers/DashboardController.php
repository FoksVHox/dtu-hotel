<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $weekStart = Carbon::parse(
            $request->query('week_start', now()->startOfWeek()->toDateString())
        )->startOfDay();

        $weekEnd = $weekStart->copy()->addDays(6)->endOfDay();

        $rooms = Room::with(['roomCategory', 'floor'])->get();

        $bookings = Booking::with(['guests', 'rooms'])
            ->whereHas('rooms', fn ($query) => $query->whereIn('rooms.id', $rooms->pluck('id')))
            ->where('end', '>=', $weekStart)
            ->where('start', '<=', $weekEnd)
            ->get();

        return Inertia::render('dashboard', [
            'rooms' => $rooms,
            'bookings' => $bookings,
            'weekStart' => $weekStart->toDateString(),
            'todayActivity' => Inertia::defer(fn () => $this->buildTodayActivity()),
            'roomStatus' => Inertia::defer(fn () => $this->buildRoomStatus()),
            'bookingPipeline' => Inertia::defer(fn () => $this->buildBookingPipeline()),
        ]);
    }

    /**
     * Today's Activity card statistics.
     *
     * - checkInsToday: bookings starting today with status Confirmed or CheckedIn
     * - checkOutsToday: bookings ending today with status CheckedIn or CheckedOut
     * - currentlyCheckedIn: bookings with status CheckedIn whose date range spans today
     * - expectedOccupancy: percentage of rooms that have any active (non-cancelled, non-maintenance) booking today
     * - pendingConfirmations: all bookings across the system with status Pending
     *
     * @return array{checkInsToday: int, checkOutsToday: int, currentlyCheckedIn: int, expectedOccupancy: int, pendingConfirmations: int}
     */
    private function buildTodayActivity(): array
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

    /**
     * Room Status card statistics.
     *
     * - occupied: rooms with a CheckedIn booking whose date range spans today
     * - maintenance: rooms with a Maintenance booking whose date range spans today
     * - available: totalRooms minus occupied minus maintenance (floor 0)
     * - checkedOutToday: rooms with a CheckedOut booking ending today
     * - *Percent: each count as a rounded percentage of totalRooms
     *
     * @return array{totalRooms: int, occupied: int, available: int, maintenance: int, checkedOutToday: int, occupiedPercent: int, availablePercent: int, maintenancePercent: int}
     */
    private function buildRoomStatus(): array
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

    /**
     * Booking Pipeline card statistics.
     *
     * - thisWeekBookings: bookings overlapping this week, excluding Cancelled and Maintenance
     * - nextWeekBookings: same logic for next week
     * - pendingConfirmations: all bookings with status Pending (same global count as Today's Activity)
     * - cancelledThisWeek: cancelled bookings whose start date falls within this week
     *   (no cancelled_at column exists, so we use start date as a proxy)
     * - occupancyThisWeek: percentage of rooms with an active booking overlapping this week
     * - occupancyLastWeek: same calculation for the previous week, used for the trend indicator
     *
     * @return array{thisWeekBookings: int, nextWeekBookings: int, pendingConfirmations: int, cancelledThisWeek: int, occupancyThisWeek: int, occupancyLastWeek: int}
     */
    private function buildBookingPipeline(): array
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
     * Percentage of rooms that have at least one active booking overlapping the given week.
     * Active means any status except Cancelled and Maintenance.
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
