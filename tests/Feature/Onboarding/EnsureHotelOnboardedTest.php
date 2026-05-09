<?php

use App\Models\Hotel;
use App\Models\User;

test('users with no hotel are redirected to onboarding', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/onboarding');
});

test('users with a hotel but no onboarded_at are redirected to onboarding', function () {
    $hotel = Hotel::factory()->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/onboarding');
});

test('fully onboarded users can reach the dashboard', function () {
    $user = $this->actingAsHotelUser();

    $this->get('/dashboard')->assertOk();
});

test('fully onboarded users visiting onboarding are redirected to dashboard', function () {
    $user = $this->actingAsHotelUser();

    $this->get('/onboarding')->assertRedirect('/dashboard');
});
