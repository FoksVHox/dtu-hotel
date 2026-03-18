<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->validationRules());

        $booking = Booking::create([
            'start' => $validated['start'],
            'end' => $validated['end'],
            'status' => $validated['status'],
        ]);
        $booking->rooms()->attach($validated['room_ids']);

        $guestIds = $validated['guest_ids'] ?? [];
        if (isset($validated['new_guests'])) {
            $guestIds = array_merge($guestIds, $this->createNewGuests($validated['new_guests']));
        }
        $booking->guests()->attach($guestIds);

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Booking $booking)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booking $booking): RedirectResponse
    {
        $validated = $request->validate($this->validationRules());

        $booking->update([
            'start' => $validated['start'],
            'end' => $validated['end'],
            'status' => $validated['status'],
        ]);
        $booking->rooms()->sync($validated['room_ids']);

        $guestIds = $validated['guest_ids'] ?? [];
        if (isset($validated['new_guests'])) {
            $guestIds = array_merge($guestIds, $this->createNewGuests($validated['new_guests']));
        }
        $booking->guests()->sync($guestIds);

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booking $booking): RedirectResponse
    {
        $booking->rooms()->detach();
        $booking->guests()->detach();
        $booking->delete();

        return redirect()->back();
    }

    private function createNewGuests(array $newGuests): array
    {
        $guestIds = [];

        foreach ($newGuests as $newGuest) {
            $guest = Guest::create([
                'first_name' => $newGuest['first_name'],
                'last_name' => $newGuest['last_name'],
                'email' => $newGuest['email'],
                'phone' => $newGuest['phone'] ?? '',
                'address' => '',
                'date_of_birth' => now(),
            ]);

            $guestIds[] = $guest->id;
        }

        return $guestIds;
    }

    private function validationRules(): array
    {
        return [
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
            'status' => ['required', Rule::enum(BookingStatus::class)],

            'room_ids' => ['required', 'array', 'min:1'],
            'room_ids.*' => ['integer', 'distinct', 'exists:rooms,id'],

            'guest_ids' => ['nullable', 'array', 'required_without_all:new_guests'],
            'guest_ids.*' => ['integer', 'distinct', 'exists:guests,id'],

            'new_guests' => ['nullable', 'array', 'required_without_all:guest_ids'],
            'new_guests.*.first_name' => ['required', 'string', 'max:255'],
            'new_guests.*.last_name' => ['required', 'string', 'max:255'],
            'new_guests.*.email' => ['required', 'email', 'max:5'],
            'new_guests.*.phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
