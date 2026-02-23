<?php

namespace Database\Seeders;

use App\Models\RoomAccessory;
use App\Models\RoomCategory;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        RoomCategory::query()->upsert([
            ['id' => 1, 'name' => 'Single', 'description' => 'Single room', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => 'Double', 'description' => 'Double room', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => 'Twin', 'description' => 'Twin room', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'name' => 'Family', 'description' => 'Family room', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'name' => 'Suite', 'description' => 'Suite room', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'name' => 'Deluxe', 'description' => 'Deluxe room', 'created_at' => $now, 'updated_at' => $now],
        ], ['id'], ['name', 'description', 'updated_at']);

        RoomAccessory::query()->upsert([
            ['id' => 1, 'name' => 'WiFi', 'description' => 'Wireless internet', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => 'TV', 'description' => 'Television', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => 'Mini Bar', 'description' => 'Mini bar', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'name' => 'Air Conditioning', 'description' => 'Air conditioning', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'name' => 'Coffee Machine', 'description' => 'Coffee machine', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'name' => 'Safe', 'description' => 'Safety box', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'name' => 'Balcony', 'description' => 'Private balcony', 'created_at' => $now, 'updated_at' => $now],
        ], ['id'], ['name', 'description', 'updated_at']);
    }
}
