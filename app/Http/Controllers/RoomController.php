<?php

namespace App\Http\Controllers;

use App\Enums\RoomStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('rooms/index', [
            'rooms' => [
                [
                    'id' => 1,
                    'code' => 'A101',
                    'category' => 'Single',
                    'floor' => 1,
                    'status' => RoomStatus::Available->value,
                ],
                [
                    'id' => 2,
                    'code' => 'A102',
                    'category' => 'Double',
                    'floor' => 1,
                    'status' => RoomStatus::Occupied->value,
                ],
                [
                    'id' => 3,
                    'code' => 'B201',
                    'category' => 'Suite',
                    'floor' => 2,
                    'status' => RoomStatus::Cleaning->value,
                ],
                [
                    'id' => 4,
                    'code' => 'B202',
                    'category' => 'Single',
                    'floor' => 2,
                    'status' => RoomStatus::OutOfOrder->value,
                ],
            ],
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
