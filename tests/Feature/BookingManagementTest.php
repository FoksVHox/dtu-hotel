<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\User;

// ── Index: Authentication ─────────────────────────────────────────────────────

test('unauthenticated user cannot access bookings index', function () {
    $this->get(route('bookings.index'))
        ->assertRedirect(route('login'));
});

// ── Index: Access & Props ─────────────────────────────────────────────────────

test('authenticated user can access bookings index', function () {
    $this->actingAsHotelUser();

    $this->get(route('bookings.index'))
        ->assertSuccessful();
});

test('index returns bookings with rooms and guests', function () {
    $user = $this->actingAsHotelUser();

    $room = Room::factory()->create(['hotel_id' => $user->hotel_id]);
    $guest = Guest::factory()->create(['hotel_id' => $user->hotel_id]);
    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $response = $this->get(route('bookings.index'));

    $response->assertSuccessful();

    $bookings = $response->original->getData()['page']['props']['bookings'];

    expect($bookings)->toHaveCount(1)
        ->and($bookings[0]['rooms'])->toHaveCount(1)
        ->and($bookings[0]['guests'])->toHaveCount(1);
});

test('response includes code key on rooms and first_name on guests', function () {
    $user = $this->actingAsHotelUser();

    $room = Room::factory()->create(['hotel_id' => $user->hotel_id]);
    $guest = Guest::factory()->create(['hotel_id' => $user->hotel_id]);
    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $response = $this->get(route('bookings.index'));

    $bookings = $response->original->getData()['page']['props']['bookings'];

    expect($bookings[0]['rooms'][0])->toHaveKey('code')
        ->and($bookings[0]['guests'][0])->toHaveKey('first_name');
});

// ── Destroy: Authentication ───────────────────────────────────────────────────

test('unauthenticated user cannot delete a booking', function () {
    $booking = Booking::factory()->create();

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect(route('login'));
});

// ── Destroy: Deletable statuses ───────────────────────────────────────────────

test('a Pending booking can be deleted', function () {
    $user = $this->actingAsHotelUser();

    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id, 'status' => BookingStatus::Pending]);

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    expect(Booking::query()->find($booking->id))->toBeNull();
});

test('a Confirmed booking can be deleted', function () {
    $user = $this->actingAsHotelUser();

    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id, 'status' => BookingStatus::Confirmed]);

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    expect(Booking::query()->find($booking->id))->toBeNull();
});

test('a Cancelled booking can be deleted', function () {
    $user = $this->actingAsHotelUser();

    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id, 'status' => BookingStatus::Cancelled]);

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect();

    expect(Booking::query()->find($booking->id))->toBeNull();
});

// ── Destroy: Non-deletable statuses ──────────────────────────────────────────

test('a CheckedIn booking cannot be deleted', function () {
    $user = $this->actingAsHotelUser();

    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id, 'status' => BookingStatus::CheckedIn]);

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect()
        ->assertSessionHasErrors('booking');

    expect(Booking::query()->find($booking->id))->not->toBeNull();
});

test('a CheckedOut booking cannot be deleted', function () {
    $user = $this->actingAsHotelUser();

    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id, 'status' => BookingStatus::CheckedOut]);

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect()
        ->assertSessionHasErrors('booking');

    expect(Booking::query()->find($booking->id))->not->toBeNull();
});

test('a Maintenance booking cannot be deleted', function () {
    $user = $this->actingAsHotelUser();

    $booking = Booking::factory()->create(['hotel_id' => $user->hotel_id, 'status' => BookingStatus::Maintenance]);

    $this->delete(route('bookings.destroy', $booking))
        ->assertRedirect()
        ->assertSessionHasErrors('booking');

    expect(Booking::query()->find($booking->id))->not->toBeNull();
});
