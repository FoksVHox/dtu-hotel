<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated users cannot create bookings', function () {
    $this->post(route('bookings.store'))
        ->assertRedirect(route('login'));
});

test('a booking can be created with rooms and existing guests', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(2)->create();
    $guest = Guest::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => $rooms->pluck('id')->toArray(),
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    $booking = Booking::query()->latest('id')->first();

    expect($booking)->not->toBeNull()
        ->and($booking->status)->toBe(BookingStatus::Confirmed)
        ->and($booking->rooms)->toHaveCount(2)
        ->and($booking->guests)->toHaveCount(1)
        ->and($booking->guests->first()->id)->toBe($guest->id);
});

test('a booking can be created with inline new guests', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [],
        'new_guests' => [
            [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'email' => 'jane@example.com',
                'phone' => '+45 12345678',
            ],
        ],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertRedirect();

    $booking = Booking::query()->latest('id')->first();
    $createdGuest = Guest::query()->where('email', 'jane@example.com')->first();

    expect($booking)->not->toBeNull()
        ->and($createdGuest)->not->toBeNull()
        ->and($createdGuest->first_name)->toBe('Jane')
        ->and($createdGuest->last_name)->toBe('Doe')
        ->and($booking->guests)->toHaveCount(1)
        ->and($booking->guests->first()->id)->toBe($createdGuest->id);
});

test('a booking can have both existing and new guests', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $existingGuest = Guest::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [$existingGuest->id],
        'new_guests' => [
            [
                'first_name' => 'John',
                'last_name' => 'Smith',
                'email' => 'john@example.com',
                'phone' => '',
            ],
        ],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(2)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    $booking = Booking::query()->latest('id')->first();

    expect($booking->guests)->toHaveCount(2);
});

test('a booking can have multiple rooms', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(3)->create();
    $guest = Guest::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => $rooms->pluck('id')->toArray(),
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(2)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertRedirect();

    $booking = Booking::query()->latest('id')->first();

    expect($booking->rooms)->toHaveCount(3);
});

test('booking creation requires at least one room', function () {
    $this->actingAs(User::factory()->create());

    $this->post(route('bookings.store'), [
        'room_ids' => [],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => now()->addDay()->toDateTimeString(),
        'end' => now()->addDays(2)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('room_ids');
});

test('booking creation requires start and end dates', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => '',
        'end' => '',
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors(['start', 'end']);
});

test('booking end date must be after start date', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => now()->addDays(3)->toDateTimeString(),
        'end' => now()->addDay()->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('end');
});

test('booking creation requires a valid status', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => now()->addDay()->toDateTimeString(),
        'end' => now()->addDays(2)->toDateTimeString(),
        'status' => 999,
    ])->assertSessionHasErrors('status');
});

test('booking creation validates room ids exist', function () {
    $this->actingAs(User::factory()->create());

    $this->post(route('bookings.store'), [
        'room_ids' => [99999],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => now()->addDay()->toDateTimeString(),
        'end' => now()->addDays(2)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('room_ids.0');
});

test('booking creation validates guest ids exist', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [99999],
        'new_guests' => [],
        'start' => now()->addDay()->toDateTimeString(),
        'end' => now()->addDays(2)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('guest_ids.0');
});

test('booking creation requires at least one guest', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(2)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Pending->value,
    ])->assertSessionHasErrors('guests');
});

test('booking creation rejects overlapping room bookings', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $existing = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $existing->rooms()->attach($room);

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDays(2)->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(4)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertSessionHasErrors('room_ids');
});

test('booking creation allows non-overlapping dates for the same room', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $existing = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $existing->rooms()->attach($room);

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDays(5)->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(7)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    expect(Booking::query()->count())->toBe(2);
});

test('booking creation ignores cancelled bookings for overlap check', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $cancelled = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Cancelled,
    ]);
    $cancelled->rooms()->attach($room);

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDay()->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(3)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertRedirect();

    expect(Booking::query()->count())->toBe(2);
});

test('booking creation rejects rooms under maintenance', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $maintenance = Booking::factory()->create([
        'start' => now()->addDay()->setTime(0, 0),
        'end' => now()->addDays(5)->setTime(23, 59),
        'status' => BookingStatus::Maintenance,
    ]);
    $maintenance->rooms()->attach($room);

    $this->post(route('bookings.store'), [
        'room_ids' => [$room->id],
        'guest_ids' => [$guest->id],
        'new_guests' => [],
        'start' => now()->addDays(2)->setTime(14, 0)->toDateTimeString(),
        'end' => now()->addDays(4)->setTime(11, 0)->toDateTimeString(),
        'status' => BookingStatus::Confirmed->value,
    ])->assertSessionHasErrors('room_ids');
});

// Guest search tests

test('unauthenticated users cannot search guests', function () {
    $this->get(route('guests.search', ['q' => 'test']))
        ->assertRedirect(route('login'));
});

test('guest search returns matching guests by name', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->create(['first_name' => 'Alice', 'last_name' => 'Johnson']);
    Guest::factory()->create(['first_name' => 'Bob', 'last_name' => 'Smith']);

    $response = $this->get(route('guests.search', ['q' => 'Alice']));

    $response->assertSuccessful();

    $results = $response->json();
    expect($results)->toHaveCount(1)
        ->and($results[0]['first_name'])->toBe('Alice');
});

test('guest search returns matching guests by email', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->create(['email' => 'unique-test@example.com']);
    Guest::factory()->create(['email' => 'other@example.com']);

    $response = $this->get(route('guests.search', ['q' => 'unique-test']));

    $response->assertSuccessful();

    $results = $response->json();
    expect($results)->toHaveCount(1)
        ->and($results[0]['email'])->toBe('unique-test@example.com');
});

test('guest search returns empty for empty query', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->create(['first_name' => 'Alice']);

    $response = $this->get(route('guests.search', ['q' => '']));

    $response->assertSuccessful();
    expect($response->json())->toHaveCount(0);
});

test('guest search returns results for single character query', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->create(['first_name' => 'Zoe', 'last_name' => 'Zenith', 'email' => 'zoe@test.com']);
    Guest::factory()->create(['first_name' => 'Bob', 'last_name' => 'Smith', 'email' => 'bob@test.com']);

    $response = $this->get(route('guests.search', ['q' => 'Z']));

    $response->assertSuccessful();

    $results = $response->json();
    expect($results)->toHaveCount(1)
        ->and($results[0]['first_name'])->toBe('Zoe');
});

test('guest search is case-insensitive', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->create(['first_name' => 'Harley', 'last_name' => 'Walker', 'email' => 'harley@example.com']);
    Guest::factory()->create(['first_name' => 'Yasmine', 'last_name' => 'Dicki', 'email' => 'yasmine@example.com']);

    $response = $this->get(route('guests.search', ['q' => 'h']));
    $results = $response->json();
    expect(collect($results)->pluck('first_name'))->toContain('Harley');

    $response = $this->get(route('guests.search', ['q' => 'y']));
    $results = $response->json();
    expect(collect($results)->pluck('first_name'))->toContain('Yasmine');

    $response = $this->get(route('guests.search', ['q' => 'HARLEY']));
    $results = $response->json();
    expect($results)->toHaveCount(1)
        ->and($results[0]['first_name'])->toBe('Harley');
});

test('guest search returns all matching results', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->count(15)->create(['first_name' => 'TestName']);

    $response = $this->get(route('guests.search', ['q' => 'TestName']));

    $response->assertSuccessful();
    expect($response->json())->toHaveCount(15);
});

test('guest search prioritises names starting with query over names containing it', function () {
    $this->actingAs(User::factory()->create());

    Guest::factory()->create(['first_name' => 'Alfredo', 'last_name' => 'Kuvalis', 'email' => 'alfredo@example.com']);
    Guest::factory()->create(['first_name' => 'Rebecca', 'last_name' => 'Taylor', 'email' => 'rebecca@example.com']);

    $response = $this->get(route('guests.search', ['q' => 're']));

    $response->assertSuccessful();

    $results = $response->json();
    expect($results)->toHaveCount(2)
        ->and($results[0]['first_name'])->toBe('Rebecca')
        ->and($results[1]['first_name'])->toBe('Alfredo');
});
