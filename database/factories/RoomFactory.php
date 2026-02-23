<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class RoomFactory extends Factory
{
    protected $model = Room::class;

    public function definition(): array
    {
        return [
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'hotel_id' => Hotel::factory(),
            'building_id' => Building::factory(),
            'floor_id' => Floor::factory(),
            'room_category_id' => RoomCategory::factory(),
        ];
    }
}
