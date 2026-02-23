<?php

namespace Database\Factories;

use App\Models\Buildings;
use App\Models\Hotels;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class BuildingsFactory extends Factory
{
    protected $model = Buildings::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'code' => $this->faker->word(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'hotels_id' => Hotels::factory(),
        ];
    }
}
