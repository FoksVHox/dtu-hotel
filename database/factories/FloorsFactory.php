<?php

namespace Database\Factories;

use App\Models\Buildings;
use App\Models\Floors;
use App\Models\Hotels;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class FloorsFactory extends Factory
{
    protected $model = Floors::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'code' => $this->faker->word(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'buildings_id' => Buildings::factory(),
            'hotels_id' => Hotels::factory(),
        ];
    }
}
