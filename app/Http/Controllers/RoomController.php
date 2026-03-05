<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
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
                    'status' => BookingStatus::Confirmed->value,
                ],
                [
                    'id' => 2,
                    'code' => 'A102',
                    'category' => 'Double',
                    'floor' => 1,
                    'status' => BookingStatus::Pending->value,
                ],
                [
                    'id' => 3,
                    'code' => 'B201',
                    'category' => 'Suite',
                    'floor' => 2,
                    'status' => BookingStatus::CheckedIn->value,
                ],
                [
                    'id' => 4,
                    'code' => 'B202',
                    'category' => 'Single',
                    'floor' => 2,
                    'status' => BookingStatus::Maintenance->value,
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
