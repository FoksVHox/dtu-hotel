<?php

namespace Database\Factories;

use App\Models\Hotel;
use App\Models\MaintenanceLog;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class MaintenanceLogFactory extends Factory
{
    protected $model = MaintenanceLog::class;

    public function definition(): array
    {
        return [
            'hotel_id' => Hotel::factory(),
            'room_id' => Room::factory(),
            'action' => $this->faker->sentence(),
            'performed_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
