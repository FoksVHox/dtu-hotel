<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated users cannot delete bookings', function () {
    $booking = Booking::factory()->create();

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect(route('login'));
});

test('a booking can be deleted', function () {
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

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    expect(Booking::query()->find($booking->id))->toBeNull();
});

test('deleting a booking removes pivot records', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(2)->create();
    $guests = Guest::factory()->count(2)->create();

    $booking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($rooms->pluck('id'));
    $booking->guests()->attach($guests->pluck('id'));

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    $this->assertDatabaseMissing('booking_room', ['booking_id' => $booking->id]);
    $this->assertDatabaseMissing('guest_booking', ['booking_id' => $booking->id]);
});

test('deleting a booking does not remove the guests themselves', function () {
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

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    expect(Guest::query()->find($guest->id))->not->toBeNull();
});

test('deleting a booking does not remove the rooms themselves', function () {
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

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    expect(Room::query()->find($room->id))->not->toBeNull();
});
