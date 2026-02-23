<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class RoomsFactory extends Factory
{
    protected $model = Room::class;

    public function definition(): array
    {
        return [
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'hotels_id' => Hotel::factory(),
            'buildings_id' => Building::factory(),
            'floors_id' => Floor::factory(),
            'room_category_id' => RoomCategory::factory(),
        ];
    }
}
