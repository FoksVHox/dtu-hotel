<?php

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\MaintenanceLog;
use App\Models\Room;
use App\Models\User;

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
