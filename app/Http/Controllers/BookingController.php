<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Guest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('bookings/index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $booking = Booking::query()->create([
                'start' => $validated['start'],
                'end' => $validated['end'],
                'status' => $validated['status'],
            ]);

            $booking->rooms()->attach($validated['room_ids']);

            $guestIds = $validated['guest_ids'] ?? [];

            foreach ($validated['new_guests'] ?? [] as $newGuest) {
                $guest = Guest::query()->create([
                    'first_name' => $newGuest['first_name'],
                    'last_name' => $newGuest['last_name'],
                    'email' => $newGuest['email'],
                    'phone' => $newGuest['phone'] ?? '',
                    'address' => '',
                    'date_of_birth' => now(),
                ]);

                $guestIds[] = $guest->id;
            }

            if (count($guestIds) > 0) {
                $booking->guests()->attach($guestIds);
            }
        });

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
