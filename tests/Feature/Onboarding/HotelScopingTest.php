<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\MaintenanceLog;
use App\Models\Room;
use App\Models\RoomCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

test('users only see bookings from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Booking::factory()->create(['hotel_id' => $hotelA->id]);
    Booking::factory()->create(['hotel_id' => $hotelB->id]);
    Booking::factory()->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(Booking::query()->count())->toBe(1);
});

test('users only see guests from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Guest::factory()->create(['hotel_id' => $hotelA->id]);
    Guest::factory()->count(3)->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(Guest::query()->count())->toBe(1);
});

test('users only see rooms from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Room::factory()->count(2)->create(['hotel_id' => $hotelA->id]);
    Room::factory()->count(5)->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(Room::query()->count())->toBe(2);
});

test('users only see maintenance logs from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    MaintenanceLog::factory()->create(['hotel_id' => $hotelA->id]);
    MaintenanceLog::factory()->count(2)->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(MaintenanceLog::query()->count())->toBe(1);
});

test('unauthenticated requests do not apply hotel scope', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Booking::factory()->create(['hotel_id' => $hotelA->id]);
    Booking::factory()->create(['hotel_id' => $hotelB->id]);

    expect(Booking::query()->count())->toBe(2);
});

test('authenticated user with null hotel_id sees nothing (deny by default)', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Booking::factory()->count(2)->create(['hotel_id' => $hotelA->id]);
    Booking::factory()->count(3)->create(['hotel_id' => $hotelB->id]);
    Room::factory()->count(4)->create(['hotel_id' => $hotelA->id]);

    $userWithNoHotel = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($userWithNoHotel);

    expect(Booking::query()->count())->toBe(0);
    expect(Room::query()->count())->toBe(0);
});

test('findOrFail of an out-of-tenant booking id raises 404', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    $bookingB = Booking::factory()->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(fn () => Booking::findOrFail($bookingB->id))
        ->toThrow(ModelNotFoundException::class);
});

test('booking creation rejects rooms that belong to another hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    $hotelBRoom = Room::factory()->create(['hotel_id' => $hotelB->id]);
    $hotelAGuest = Guest::factory()->create(['hotel_id' => $hotelA->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA)
        ->post(route('bookings.store'), [
            'room_ids' => [$hotelBRoom->id],
            'guest_ids' => [$hotelAGuest->id],
            'start' => now()->addDay()->toDateTimeString(),
            'end' => now()->addDays(3)->toDateTimeString(),
            'status' => BookingStatus::Confirmed->value,
        ])
        ->assertSessionHasErrors(['room_ids.0']);
});

test('booking creation rejects guests that belong to another hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    $hotelARoom = Room::factory()->create(['hotel_id' => $hotelA->id]);
    $hotelBGuest = Guest::factory()->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA)
        ->post(route('bookings.store'), [
            'room_ids' => [$hotelARoom->id],
            'guest_ids' => [$hotelBGuest->id],
            'start' => now()->addDay()->toDateTimeString(),
            'end' => now()->addDays(3)->toDateTimeString(),
            'status' => BookingStatus::Confirmed->value,
        ])
        ->assertSessionHasErrors(['guest_ids.0']);
});

test('onboarding rooms step rejects floor_id from another hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();
    $hotelBBuilding = Building::factory()->create(['hotel_id' => $hotelB->id]);
    $hotelBFloor = Floor::factory()->create([
        'hotel_id' => $hotelB->id,
        'building_id' => $hotelBBuilding->id,
    ]);
    $category = RoomCategory::factory()->create();

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($userA)
        ->post('/onboarding/rooms', [
            'rules' => [[
                'start_number' => 1,
                'end_number' => 3,
                'floor_id' => $hotelBFloor->id,
                'category_id' => $category->id,
            ]],
        ])
        ->assertSessionHasErrors(['rules.0.floor_id']);
});

test('complete refuses when user has no hotel', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/complete')
        ->assertStatus(422);

    $user->refresh();
    expect($user->onboarded_at)->toBeNull();
});

test('complete refuses when user has hotel but no rooms', function () {
    $hotel = Hotel::factory()->create();
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/complete')
        ->assertStatus(422);

    $user->refresh();
    expect($user->onboarded_at)->toBeNull();
});
