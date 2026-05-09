<?php

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomCategory;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('show returns step 1 when user has no hotel', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 1)
        );
});

test('show returns step 2 when user has hotel but no buildings', function () {
    $hotel = Hotel::factory()->create();
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 2)
        );
});

test('show returns step 3 when user has buildings but no rooms', function () {
    $hotel = Hotel::factory()->create();
    Building::factory()->create(['hotel_id' => $hotel->id]);
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 3)
        );
});

test('show returns step 4 when user has rooms but is not yet onboarded', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    Room::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
        'floor_id' => $floor->id,
    ]);
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 4)
        );
});

test('show passes hotel, buildings with floors, and categories to props', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    Floor::factory()->count(2)->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    RoomCategory::factory()->count(3)->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->has('hotel')
            ->has('buildings', 1, fn (AssertableInertia $b) => $b
                ->has('floors', 2)
                ->etc()
            )
            ->has('categories')
        );
});
