<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated users cannot update bookings', function () {
    $booking = Booking::factory()->create();

    $this->put(route('bookings.update', $booking))
        ->assertRedirect(route('login'));
});

test('a booking can be updated with new dates and status', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $newStart = now()->addDays(5)->setTime(14, 0)->toDateTimeString();
    $newEnd = now()->addDays(7)->setTime(11, 0)->toDateTimeString();

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => $newStart,
        'end' => $newEnd,
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    $booking->refresh();

    expect($booking->status)->toBe(BookingStatus::Confirmed)
        ->and($booking->start->toDateTimeString())->toBe($newStart)
        ->and($booking->end->toDateTimeString())->toBe($newEnd);
});

test('updating a booking syncs rooms', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(3)->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($rooms->pluck('id'));
    $booking->guests()->attach($guest);

    $newRooms = Room::factory()->count(2)->create();

    $this->put(route('bookings.update', $booking), [
        'room_ids' => $newRooms->pluck('id')->toArray(),
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    $booking->refresh();

    expect($booking->rooms)->toHaveCount(2)
        ->and($booking->rooms->pluck('id')->toArray())
        ->toBe($newRooms->pluck('id')->toArray());
});

test('updating a booking syncs existing guests', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $originalGuest = Guest::factory()->create();
    $newGuest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($originalGuest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$newGuest->id],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    $booking->refresh();

    expect($booking->guests)->toHaveCount(1)
        ->and($booking->guests->first()->id)->toBe($newGuest->id);
});

test('updating a booking can add inline new guests', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [
            [
                'first_name' => 'New',
                'last_name' => 'Person',
                'email' => 'new@example.com',
                'phone' => '',
            ],
        ],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertRedirect();

    $booking->refresh();

    expect($booking->guests)->toHaveCount(2);

    $createdGuest = Guest::query()->where('email', 'new@example.com')->first();
    expect($createdGuest)->not->toBeNull()
        ->and($createdGuest->first_name)->toBe('New');
});

test('updating a booking excludes itself from overlap validation', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(15, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(12, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    $booking->refresh();

    expect($booking->start->format('H:i'))->toBe('15:00');
});

test('updating a booking rejects overlapping room bookings from other bookings', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $otherBooking = Booking::factory()->create([
        'start' => now()->addDays(5)->setTime(14, 0),
        'end' => now()->addDays(7)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $otherBooking->rooms()->attach($room);

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDays(5)->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(7)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('room_ids');
});

test('update requires at least one room', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDay()->toDateTimeString(),
        'end' => now()->addDays(2)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('room_ids');
});

test('update requires at least one guest', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(2)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('guests');
});

test('update end date must be after start date', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDays(3)->toDateTimeString(),
        'end' => now()->addDay()->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('end');
});

test('updating a booking rejects rooms under maintenance from other bookings', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $maintenance = Booking::factory()->create([
        'start' => now()->addDays(5)->setTime(0, 0),
        'end' => now()->addDays(10)->setTime(23, 59),
        'status' => BookingStatus::Maintenance,
    ]);
    $maintenance->rooms()->attach($room);

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Pending,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->put(route('bookings.update', $booking), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDays(6)->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(8)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('room_ids');
});
