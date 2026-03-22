<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(): Response
    {
        $bookings = Booking::query()
            ->with(['guests', 'rooms.building', 'rooms.floor', 'rooms.roomCategory'])
            ->latest()
            ->get()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'start' => $booking->start->toIso8601String(),
                'end' => $booking->end->toIso8601String(),
                'status' => $booking->status->value,
                'guests' => $booking->guests->map(fn (Guest $guest) => [
                    'id' => $guest->id,
                    'first_name' => $guest->first_name,
                    'last_name' => $guest->last_name,
                    'email' => $guest->email,
                    'phone' => $guest->phone,
                ]),
                'rooms' => $booking->rooms->map(fn (Room $room) => [
                    'id' => $room->id,
                    'code' => $room->building->code.'-'.$room->floor->name.'-'.$room->id,
                    'room_category' => ['name' => $room->roomCategory?->name ?? ''],
                    'floor' => ['code' => $room->floor->code],
                ]),
            ]);

        return Inertia::render('bookings/index', ['bookings' => $bookings]);
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

    public function destroy(Booking $booking): RedirectResponse
    {
        $deletableStatuses = [
            BookingStatus::Pending,
            BookingStatus::Confirmed,
            BookingStatus::Cancelled,
        ];

        if (! in_array($booking->status, $deletableStatuses, strict: true)) {
            return redirect()->back()->withErrors(['booking' => 'This booking cannot be deleted in its current status.']);
        }

        $booking->delete();

        return redirect()->back();
    }
}
