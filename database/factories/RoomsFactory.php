<?php

namespace Database\Factories;

use App\Models\Buildings;
use App\Models\Floors;
use App\Models\Hotels;
use App\Models\RoomAccessory;
use App\Models\RoomCategory;
use App\Models\Rooms;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class RoomsFactory extends Factory
{
    protected $model = Rooms::class;

    public function definition(): array
    {
        return [
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),

            'hotels_id' => Hotels::factory(),
            'buildings_id' => Buildings::factory(),
            'floors_id' => Floors::factory(),
            'room_category_id' => RoomCategory::factory(),
        ];
    }
}
