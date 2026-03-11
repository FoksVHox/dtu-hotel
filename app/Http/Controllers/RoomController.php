<?php

namespace App\Http\Controllers;

use App\Enums\RoomStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Room;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $rooms = Room:: with(['roomCategory', 'floor' ]) -> get();
        return Inertia::render('rooms/index', [
            'rooms' => $rooms,

        ]);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
