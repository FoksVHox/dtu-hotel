<?php

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Models\Booking;
use App\Models\MaintenanceLog;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Authentication ────────────────────────────────────────────────────────────

test('unauthenticated users cannot update a booking', function () {
    $booking = Booking::factory()->create();

    $this->patch(route('bookings.update', $booking))
        ->assertRedirect(route('login'));
});

test('unauthenticated users cannot update a room', function () {
    $room = Room::factory()->create();

    $this->patch(route('rooms.update', $room))
        ->assertRedirect(route('login'));
});

// ── Issue #48: Auto-trigger Cleaning on checkout ──────────────────────────────

test('checking out a booking sets attached rooms to Cleaning', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(2)->create(['status' => RoomStatus::Occupied]);
    $booking = Booking::factory()->create(['status' => BookingStatus::CheckedIn]);
    $booking->rooms()->attach($rooms->pluck('id'));

    $this->patch(route('bookings.update', $booking), [
        'status' => BookingStatus::CheckedOut->value,
    ])->assertRedirect();

    foreach ($rooms as $room) {
        expect($room->fresh()->status)->toBe(RoomStatus::Cleaning);
    }
});

test('checking in a booking sets attached rooms to Occupied', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(2)->create(['status' => RoomStatus::Available]);
    $booking = Booking::factory()->create(['status' => BookingStatus::Confirmed]);
    $booking->rooms()->attach($rooms->pluck('id'));

    $this->patch(route('bookings.update', $booking), [
        'status' => BookingStatus::CheckedIn->value,
    ])->assertRedirect();

    foreach ($rooms as $room) {
        expect($room->fresh()->status)->toBe(RoomStatus::Occupied);
    }
});

test('cancelling a booking sets attached rooms to Available', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(2)->create(['status' => RoomStatus::Occupied]);
    $booking = Booking::factory()->create(['status' => BookingStatus::Confirmed]);
    $booking->rooms()->attach($rooms->pluck('id'));

    $this->patch(route('bookings.update', $booking), [
        'status' => BookingStatus::Cancelled->value,
    ])->assertRedirect();

    foreach ($rooms as $room) {
        expect($room->fresh()->status)->toBe(RoomStatus::Available);
    }
});

test('booking statuses without room transitions do not change room status', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create(['status' => RoomStatus::Available]);
    $booking = Booking::factory()->create(['status' => BookingStatus::Pending]);
    $booking->rooms()->attach($room);

    $this->patch(route('bookings.update', $booking), [
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    expect($room->fresh()->status)->toBe(RoomStatus::Available);
});

// ── Issue #49: Mark room as cleaned ──────────────────────────────────────────

test('marking a cleaning room as clean sets status to Available', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create(['status' => RoomStatus::Cleaning]);

    $this->patch(route('rooms.update', $room), [
        'status' => RoomStatus::Available->value,
    ])->assertRedirect();

    expect($room->fresh()->status)->toBe(RoomStatus::Available);
});

test('marking a cleaning room as clean creates a MaintenanceLog record', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create(['status' => RoomStatus::Cleaning]);

    $this->patch(route('rooms.update', $room), [
        'status' => RoomStatus::Available->value,
    ])->assertRedirect();

    expect(MaintenanceLog::query()->where('room_id', $room->id)->count())->toBe(1);

    $log = MaintenanceLog::query()->where('room_id', $room->id)->first();
    expect($log->action)->toBe('cleaned')
        ->and($log->performed_at)->not->toBeNull();
});

test('marking a non-cleaning room as available does not create a MaintenanceLog', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create(['status' => RoomStatus::Available]);

    $this->patch(route('rooms.update', $room), [
        'status' => RoomStatus::Available->value,
    ])->assertRedirect();

    expect(MaintenanceLog::query()->where('room_id', $room->id)->count())->toBe(0);
});

// ── Issue #50: Schedule cleaning time ────────────────────────────────────────

test('assigning a scheduled_cleaning_at persists to the room', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create(['status' => RoomStatus::Cleaning]);
    $scheduledAt = now()->addHours(2)->toDateTimeString();

    $this->patch(route('rooms.update', $room), [
        'scheduled_cleaning_at' => $scheduledAt,
    ])->assertRedirect();

    expect($room->fresh()->scheduled_cleaning_at)->not->toBeNull();
});

// ── Issue #47: Maintenance page ───────────────────────────────────────────────

test('maintenance page returns only rooms with Cleaning status', function () {
    $this->actingAs(User::factory()->create());

    $cleaningRoom = Room::factory()->create(['status' => RoomStatus::Cleaning]);
    Room::factory()->create(['status' => RoomStatus::Available]);
    Room::factory()->create(['status' => RoomStatus::Occupied]);

    $response = $this->get(route('maintenance.index'));

    $response->assertSuccessful();

    $cleaningRooms = $response->original->getData()['page']['props']['cleaningRooms'];

    expect($cleaningRooms)->toHaveCount(1)
        ->and($cleaningRooms[0]['id'])->toBe($cleaningRoom->id);
});

test('maintenance page returns empty when no rooms are cleaning', function () {
    $this->actingAs(User::factory()->create());

    Room::factory()->create(['status' => RoomStatus::Available]);

    $response = $this->get(route('maintenance.index'));

    $response->assertSuccessful();

    $cleaningRooms = $response->original->getData()['page']['props']['cleaningRooms'];

    expect($cleaningRooms)->toBeEmpty();
});
