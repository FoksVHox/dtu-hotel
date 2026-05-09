<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated users cannot delete bookings', function () {
    $booking = Booking::factory()->create();

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect(route('login'));
});

test('a booking can be deleted', function () {
    $user = $this->actingAsHotelUser();

    $room = Room::factory()->create(['hotel_id' => $user->hotel_id]);
    $guest = Guest::factory()->create(['hotel_id' => $user->hotel_id]);

    $booking = Booking::factory()->create([
        'hotel_id' => $user->hotel_id,
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
    $user = $this->actingAsHotelUser();

    $rooms = Room::factory()->count(2)->create(['hotel_id' => $user->hotel_id]);
    $guests = Guest::factory()->count(2)->create(['hotel_id' => $user->hotel_id]);

    $booking = Booking::factory()->create([
        'hotel_id' => $user->hotel_id,
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
    $user = $this->actingAsHotelUser();

    $room = Room::factory()->create(['hotel_id' => $user->hotel_id]);
    $guest = Guest::factory()->create(['hotel_id' => $user->hotel_id]);

    $booking = Booking::factory()->create([
        'hotel_id' => $user->hotel_id,
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
    $user = $this->actingAsHotelUser();

    $room = Room::factory()->create(['hotel_id' => $user->hotel_id]);
    $guest = Guest::factory()->create(['hotel_id' => $user->hotel_id]);

    $booking = Booking::factory()->create([
        'hotel_id' => $user->hotel_id,
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
