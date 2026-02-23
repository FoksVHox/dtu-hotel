<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\RoomAccessory;
use App\Models\RoomCategory;
use App\Models\Room;
use Illuminate\Database\Seeder;

class HotelStructureSeeder extends Seeder
{
    public function run(): void
    {
        $categories = RoomCategory::all();
        $accessories = RoomAccessory::all();

        if ($categories->isEmpty() || $accessories->isEmpty()) {
            throw new \RuntimeException('Reference data mangler. Kør ReferenceDataSeeder først.');
        }

        // 2 fiktive hoteller (via factory)
        $hotels = collect([
            Hotel::factory()->create([
                'name' => 'North Harbor Hotel',
                'cvr' => '12345678',
                'phone' => '+45 20112233',
                'email' => 'info@northharborhotel.test',
                'domain' => 'northharborhotel.test',
                'address' => 'Harborvej 12, 2800 Kongens Lyngby',
                'currency' => 'DKK',
            ]),
            Hotel::factory()->create([
                'name' => 'Aurora Stay Copenhagen',
                'cvr' => '87654321',
                'phone' => '+45 20998877',
                'email' => 'contact@aurorastay.test',
                'domain' => 'aurorastay.test',
                'address' => 'Citygade 44, 1550 København V',
                'currency' => 'DKK',
            ]),
        ]);

        foreach ($hotels as $hotelIndex => $hotel) {
            $buildingCount = rand(1, 3);

            for ($b = 1; $b <= $buildingCount; $b++) {
                $building = Building::factory()->create([
                    'hotels_id' => $hotel->id,
                    'name' => "Building {$b}",
                    'code' => 'H'.$hotel->id.'-B'.$b, // unik og læsbar
                    'address' => $hotel->address,
                    'phone' => $hotel->phone,
                ]);

                $floorCount = rand(2, 5);

                for ($f = 1; $f <= $floorCount; $f++) {
                    $floor = Floor::factory()->create([
                        'hotels_id' => $hotel->id,
                        'buildings_id' => $building->id,
                        'name' => "Floor {$f}",
                        // floors.code er unique globalt i din migration
                        'code' => 'H'.$hotel->id.'-B'.$building->id.'-F'.$f,
                    ]);

                    $roomsOnFloor = rand(6, 15);

                    for ($r = 1; $r <= $roomsOnFloor; $r++) {
                        $primaryAccessory = $accessories->random();

                        $room = Room::factory()->create([
                            'hotels_id' => $hotel->id,
                            'buildings_id' => $building->id,
                            'floors_id' => $floor->id,
                            'room_category_id' => $categories->random()->id,
                        ]);

                        // Pivot accessories (1-4 accessories pr. rum)
                        $extraAccessoryIds = $accessories
                            ->shuffle()
                            ->take(rand(1, min(4, $accessories->count())))
                            ->pluck('id');

                        $allAccessoryIds = collect([$primaryAccessory->id])
                            ->merge($extraAccessoryIds)
                            ->unique()
                            ->values()
                            ->all();

                        $room->roomAccessories()->sync($allAccessoryIds);
                    }
                }
            }
        }
    }
}
