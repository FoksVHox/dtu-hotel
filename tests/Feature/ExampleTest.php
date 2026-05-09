<?php

it('serves the landing page to unauthenticated visitors', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

it('redirects authenticated users from / to the dashboard', function () {
    $this->actingAsHotelUser();

    $this->get('/')->assertRedirect(route('dashboard'));
});

it('redirects authenticated but un-onboarded users from / to onboarding via the dashboard middleware', function () {
    $user = App\Models\User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/')
        ->assertRedirect(route('dashboard'));

    // The dashboard's middleware then bounces them to onboarding.
    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.show'));
});
