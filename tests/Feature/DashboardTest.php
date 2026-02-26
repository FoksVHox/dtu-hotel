<?php

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard returns rooms with room category and floor', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('rooms', 1, fn (AssertableInertia $room) => $room
                ->hasAll(['id', 'hotel_id', 'building_id', 'floor_id', 'room_category_id'])
                ->has('room_category', fn (AssertableInertia $cat) => $cat
                    ->hasAll(['id', 'name', 'description'])
                    ->etc()
                )
                ->has('floor', fn (AssertableInertia $floor) => $floor
                    ->hasAll(['id', 'name', 'code'])
                    ->etc()
                )
                ->etc()
            )
        );
});

test('dashboard returns bookings with guests and rooms for the current week', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $weekStart = now()->startOfWeek();

    $booking = Booking::factory()->create([
        'start' => $weekStart->copy()->addDay()->setTime(14, 0),
        'end' => $weekStart->copy()->addDays(3)->setTime(11, 0),
        'status' => 1,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('bookings', 1, fn (AssertableInertia $booking) => $booking
                ->hasAll(['id', 'start', 'end', 'status'])
                ->has('guests', 1, fn (AssertableInertia $g) => $g
                    ->hasAll(['id', 'first_name', 'last_name'])
                    ->etc()
                )
                ->has('rooms', 1, fn (AssertableInertia $r) => $r
                    ->has('id')
                    ->etc()
                )
                ->etc()
            )
            ->has('weekStart')
        );
});

test('dashboard booking dates are serialized as datetime strings', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->startOfWeek()->addDay()->setTime(14, 0),
        'end' => now()->startOfWeek()->addDays(3)->setTime(11, 0),
    ]);
    $booking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('bookings', 1, fn (AssertableInertia $b) => $b
                ->where('start', fn ($value) => is_string($value) && str_contains($value, 'T'))
                ->where('end', fn ($value) => is_string($value) && str_contains($value, 'T'))
                ->etc()
            )
        );
});

test('dashboard filters bookings to the requested week', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $targetWeek = Carbon::parse('2026-03-09')->startOfWeek();

    $inRangeBooking = Booking::factory()->create([
        'start' => $targetWeek->copy()->addDay()->setTime(14, 0),
        'end' => $targetWeek->copy()->addDays(3)->setTime(11, 0),
        'status' => 1,
    ]);
    $inRangeBooking->rooms()->attach($room);

    $outOfRangeBooking = Booking::factory()->create([
        'start' => $targetWeek->copy()->addWeeks(3)->setTime(14, 0),
        'end' => $targetWeek->copy()->addWeeks(3)->addDays(2)->setTime(11, 0),
        'status' => 1,
    ]);
    $outOfRangeBooking->rooms()->attach($room);

    $this->get(route('dashboard', ['week_start' => $targetWeek->toDateString()]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('bookings', 1)
            ->where('weekStart', $targetWeek->toDateString())
        );
});

test('dashboard defaults to the current week when no week_start param is given', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('weekStart', now()->startOfWeek()->toDateString())
        );
});
