<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class FloorFactory extends Factory
{
    protected $model = Floor::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'code' => $this->faker->word(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'building_id' => Building::factory(),
            'hotel_id' => Hotel::factory(),
        ];
    }
}
