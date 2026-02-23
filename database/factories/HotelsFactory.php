<?php

namespace Database\Factories;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class HotelsFactory extends Factory
{
    protected $model = Hotel::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'cvr' => $this->faker->word(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'domain' => $this->faker->word(),
            'address' => $this->faker->address(),
            'currency' => $this->faker->word(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
