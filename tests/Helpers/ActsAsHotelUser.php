<?php

namespace Tests\Helpers;

use App\Models\Hotel;
use App\Models\User;

trait ActsAsHotelUser
{
    /**
     * Create a user owning a fresh hotel, log them in, and return the user.
     */
    public function actingAsHotelUser(?Hotel $hotel = null): User
    {
        $hotel ??= Hotel::factory()->create();

        $user = User::factory()->create([
            'hotel_id' => $hotel->id,
            'onboarded_at' => now(),
        ]);

        $this->actingAs($user);

        return $user;
    }
}
