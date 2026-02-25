<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $rooms = Room::with('roomCategory', 'floor', 'bookings')->get();

        return Inertia::render('dashboard', [
            'rooms' => $rooms,
        ]);
    }
}
