<?php

namespace Database\Factories;

use App\Models\Bookings;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class BookingsFactory extends Factory
{
    protected $model = Bookings::class;

    public function definition(): array
    {
        return [
            'start' => Carbon::now(),
            'end' => Carbon::now(),
            'status' => $this->faker->randomNumber(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
