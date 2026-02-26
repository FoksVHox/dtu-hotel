<?php

namespace App\Http\Controllers;

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

        $bookings = Booking::with(['guests:id,first_name,last_name', 'rooms:id'])
            ->whereHas('rooms', fn ($query) => $query->whereIn('rooms.id', $rooms->pluck('id')))
            ->where('end', '>=', $weekStart)
            ->where('start', '<=', $weekEnd)
            ->get();

        return Inertia::render('dashboard', [
            'rooms' => $rooms,
            'bookings' => $bookings,
            'weekStart' => $weekStart->toDateString(),
        ]);
    }
}
