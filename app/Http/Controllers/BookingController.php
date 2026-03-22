<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Guest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('bookings/index');
    }

    public function create(): void {}

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
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
        } catch (\Throwable) {
            return redirect()->back()->withErrors([
                'booking' => 'Something went wrong while creating the booking. Please try again.',
            ]);
        }

        return redirect()->back();
    }

    public function show(string $id): void {}

    public function edit(string $id): void {}

    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        DB::transaction(function () use ($request, $booking): void {
            $newStatus = BookingStatus::from($request->validated()['status']);
            $booking->update(['status' => $newStatus]);

            $roomStatus = match ($newStatus) {
                BookingStatus::CheckedIn => RoomStatus::Occupied,
                BookingStatus::CheckedOut => RoomStatus::Cleaning,
                BookingStatus::Cancelled => RoomStatus::Available,
                default => null,
            };

            if ($roomStatus !== null) {
                $booking->rooms()->update(['status' => $roomStatus->value]);
            }
        });

        return redirect()->back();
    }

    public function destroy(string $id): void {}
}
