<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    get(route('rooms.index'))
        ->assertRedirect(route('login'));
});

test('rooms index resolves room statuses from booking statuses', function () {
    actingAs(User::factory()->create());

    $availableRoom = Room::factory()->create();
    $occupiedRoom = Room::factory()->create();
    $cleaningRoom = Room::factory()->create();
    $outOfOrderRoom = Room::factory()->create();

    $occupiedBooking = Booking::factory()->create([
        'start' => now()->subDay()->setTime(14, 0),
        'end' => now()->addDay()->setTime(11, 0),
        'status' => BookingStatus::CheckedIn,
    ]);
    $occupiedBooking->rooms()->attach($occupiedRoom);

    $cleaningBooking = Booking::factory()->create([
        'start' => now()->subDays(2)->setTime(14, 0),
        'end' => now()->setTime(11, 0),
        'status' => BookingStatus::CheckedOut,
    ]);
    $cleaningBooking->rooms()->attach($cleaningRoom);

    $maintenanceBooking = Booking::factory()->create([
        'start' => now()->subDay(),
        'end' => now()->addDay(),
        'status' => BookingStatus::Maintenance,
    ]);
    $maintenanceBooking->rooms()->attach($outOfOrderRoom);

    get(route('rooms.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('rooms/index')
            ->has('rooms', 4)
            ->where('rooms', function ($rooms) use ($availableRoom, $occupiedRoom, $cleaningRoom, $outOfOrderRoom): bool {
                $statusesByRoomId = collect($rooms)
                    ->mapWithKeys(fn (array $room): array => [$room['id'] => $room['status']]);

                return $statusesByRoomId->get($availableRoom->id) === BookingStatus::Unknown->value
                    && $statusesByRoomId->get($occupiedRoom->id) === BookingStatus::CheckedIn->value
                    && $statusesByRoomId->get($cleaningRoom->id) === BookingStatus::CheckedOut->value
                    && $statusesByRoomId->get($outOfOrderRoom->id) === BookingStatus::Maintenance->value;
            })
        );
});

test('rooms index includes confirmed and cancelled statuses', function () {
    actingAs(User::factory()->create());

    $confirmedRoom = Room::factory()->create();
    $cancelledRoom = Room::factory()->create();

    $confirmedBooking = Booking::factory()->create([
        'start' => now()->addDay()->setTime(14, 0),
        'end' => now()->addDays(3)->setTime(11, 0),
        'status' => BookingStatus::Confirmed,
    ]);
    $confirmedBooking->rooms()->attach($confirmedRoom);

    $cancelledBooking = Booking::factory()->create([
        'start' => now()->addDays(4)->setTime(14, 0),
        'end' => now()->addDays(5)->setTime(11, 0),
        'status' => BookingStatus::Cancelled,
    ]);
    $cancelledBooking->rooms()->attach($cancelledRoom);

    get(route('rooms.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('rooms/index')
            ->has('rooms', 2)
            ->where('rooms', function ($rooms) use ($confirmedRoom, $cancelledRoom): bool {
                $statusesByRoomId = collect($rooms)
                    ->mapWithKeys(fn (array $room): array => [$room['id'] => $room['status']]);

                return $statusesByRoomId->get($confirmedRoom->id) === BookingStatus::Confirmed->value
                    && $statusesByRoomId->get($cancelledRoom->id) === BookingStatus::Cancelled->value;
            })
        );
});
