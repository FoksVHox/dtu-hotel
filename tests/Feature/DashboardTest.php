<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia;

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
        'status' => BookingStatus::Confirmed,
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
        'status' => BookingStatus::Confirmed,
    ]);
    $inRangeBooking->rooms()->attach($room);

    $outOfRangeBooking = Booking::factory()->create([
        'start' => $targetWeek->copy()->addWeeks(3)->setTime(14, 0),
        'end' => $targetWeek->copy()->addWeeks(3)->addDays(2)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
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

test('dashboard booking rooms include room category and floor', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $weekStart = now()->startOfWeek();

    $booking = Booking::factory()->create([
        'start' => $weekStart->copy()->addDay()->setTime(14, 0),
        'end' => $weekStart->copy()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('bookings', 1, fn (AssertableInertia $b) => $b
                ->has('rooms', 1, fn (AssertableInertia $r) => $r
                    ->has('id')
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
                ->etc()
            )
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

test('dashboard refresh returns updated bookings', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();
    $guest = Guest::factory()->create();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('bookings', 0)
        );

    $booking = Booking::factory()->create([
        'start' => now()->startOfWeek()->addDay()->setTime(14, 0),
        'end' => now()->startOfWeek()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($room);
    $booking->guests()->attach($guest);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('bookings', 1)
            ->has('rooms')
        );
});

test('dashboard deferred props are not in the initial response', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->missing('todayActivity')
            ->missing('roomStatus')
            ->missing('bookingPipeline')
        );
});

test('today activity counts check-ins starting today', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->setTime(14, 0),
        'end' => now()->addDays(2)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $booking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('todayActivity', fn (AssertableInertia $stats) => $stats
                    ->where('checkInsToday', 1)
                    ->where('checkOutsToday', 0)
                    ->where('expectedOccupancy', 100)
                    ->etc()
                )
            )
        );
});

test('today activity counts check-outs ending today', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->subDays(2)->setTime(14, 0),
        'end' => now()->setTime(11, 0),
        'status' => BookingStatus::CheckedOut,
    ]);
    $booking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('todayActivity', fn (AssertableInertia $stats) => $stats
                    ->where('checkOutsToday', 1)
                    ->where('checkInsToday', 0)
                    ->etc()
                )
            )
        );
});

test('today activity counts currently checked in guests', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $booking = Booking::factory()->create([
        'start' => now()->subDay()->setTime(14, 0),
        'end' => now()->addDay()->setTime(11, 0),
        'status' => BookingStatus::CheckedIn,
    ]);
    $booking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('todayActivity', fn (AssertableInertia $stats) => $stats
                    ->where('currentlyCheckedIn', 1)
                    ->etc()
                )
            )
        );
});

test('today activity counts pending confirmations', function () {
    $this->actingAs(User::factory()->create());

    Booking::factory()->create(['status' => BookingStatus::Pending]);
    Booking::factory()->create(['status' => BookingStatus::Pending]);
    Booking::factory()->create(['status' => BookingStatus::Confirmed]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('todayActivity', fn (AssertableInertia $stats) => $stats
                    ->where('pendingConfirmations', 2)
                    ->etc()
                )
            )
        );
});

test('room status counts occupied and available rooms', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(3)->create();

    $booking = Booking::factory()->create([
        'start' => now()->subDay()->setTime(14, 0),
        'end' => now()->addDay()->setTime(11, 0),
        'status' => BookingStatus::CheckedIn,
    ]);
    $booking->rooms()->attach($rooms[0]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('roomStatus', fn (AssertableInertia $stats) => $stats
                    ->where('totalRooms', 3)
                    ->where('occupied', 1)
                    ->where('available', 2)
                    ->where('maintenance', 0)
                    ->where('occupiedPercent', 33)
                    ->etc()
                )
            )
        );
});

test('room status counts maintenance rooms', function () {
    $this->actingAs(User::factory()->create());

    $rooms = Room::factory()->count(4)->create();

    $maintenanceBooking = Booking::factory()->create([
        'start' => now()->subDay(),
        'end' => now()->addDay(),
        'status' => BookingStatus::Maintenance,
    ]);
    $maintenanceBooking->rooms()->attach($rooms[0]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('roomStatus', fn (AssertableInertia $stats) => $stats
                    ->where('totalRooms', 4)
                    ->where('maintenance', 1)
                    ->where('maintenancePercent', 25)
                    ->where('available', 3)
                    ->etc()
                )
            )
        );
});

test('booking pipeline counts bookings this week and next week', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $thisWeekBooking = Booking::factory()->create([
        'start' => now()->startOfWeek()->addDay()->setTime(14, 0),
        'end' => now()->startOfWeek()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $thisWeekBooking->rooms()->attach($room);

    $nextWeekBooking = Booking::factory()->create([
        'start' => now()->startOfWeek()->addWeek()->addDay()->setTime(14, 0),
        'end' => now()->startOfWeek()->addWeek()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $nextWeekBooking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('bookingPipeline', fn (AssertableInertia $stats) => $stats
                    ->where('thisWeekBookings', 1)
                    ->where('nextWeekBookings', 1)
                    ->etc()
                )
            )
        );
});

test('booking pipeline excludes cancelled bookings from counts', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $activeBooking = Booking::factory()->create([
        'start' => now()->startOfWeek()->addDay()->setTime(14, 0),
        'end' => now()->startOfWeek()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $activeBooking->rooms()->attach($room);

    $cancelledBooking = Booking::factory()->create([
        'start' => now()->startOfWeek()->addDays(2)->setTime(14, 0),
        'end' => now()->startOfWeek()->addDays(4)->setTime(11, 0),
        'status' => BookingStatus::Cancelled,
    ]);
    $cancelledBooking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('bookingPipeline', fn (AssertableInertia $stats) => $stats
                    ->where('thisWeekBookings', 1)
                    ->where('cancelledThisWeek', 1)
                    ->etc()
                )
            )
        );
});

test('booking pipeline shows occupancy trend between this and last week', function () {
    $this->actingAs(User::factory()->create());

    $room = Room::factory()->create();

    $lastWeekBooking = Booking::factory()->create([
        'start' => now()->startOfWeek()->subWeek()->addDay()->setTime(14, 0),
        'end' => now()->startOfWeek()->subWeek()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $lastWeekBooking->rooms()->attach($room);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('bookingPipeline', fn (AssertableInertia $stats) => $stats
                    ->where('occupancyThisWeek', 0)
                    ->where('occupancyLastWeek', 100)
                    ->etc()
                )
            )
        );
});

test('statistics return zeros when no bookings exist', function () {
    $this->actingAs(User::factory()->create());

    Room::factory()->count(2)->create();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                ->has('todayActivity', fn (AssertableInertia $stats) => $stats
                    ->where('checkInsToday', 0)
                    ->where('checkOutsToday', 0)
                    ->where('currentlyCheckedIn', 0)
                    ->where('expectedOccupancy', 0)
                    ->where('pendingConfirmations', 0)
                )
                ->has('roomStatus', fn (AssertableInertia $stats) => $stats
                    ->where('totalRooms', 2)
                    ->where('occupied', 0)
                    ->where('available', 2)
                    ->where('maintenance', 0)
                    ->where('checkedOutToday', 0)
                    ->where('occupiedPercent', 0)
                    ->where('availablePercent', 100)
                    ->where('maintenancePercent', 0)
                )
                ->has('bookingPipeline', fn (AssertableInertia $stats) => $stats
                    ->where('thisWeekBookings', 0)
                    ->where('nextWeekBookings', 0)
                    ->where('pendingConfirmations', 0)
                    ->where('cancelledThisWeek', 0)
                    ->where('occupancyThisWeek', 0)
                    ->where('occupancyLastWeek', 0)
                )
            )
        );
});
