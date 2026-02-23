<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class BuildingsFactory extends Factory
{
    protected $model = Building::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'code' => $this->faker->word(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'hotels_id' => Hotel::factory(),
        ];
    }
}
