<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $rooms = Room::all();

        return Inertia::render('dashboard', [
            'rooms' => $rooms,
        ]);
    }
}
