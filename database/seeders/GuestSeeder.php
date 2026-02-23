<?php

namespace Database\Seeders;

use App\Models\Guest;
use Illuminate\Database\Seeder;

class GuestSeeder extends Seeder
{
    public function run(): void
    {
        Guest::factory()
            ->count(100)
            ->state(function () {
                return [
                    'date_of_birth' => now()
                        ->subYears(rand(18, 80))
                        ->subDays(rand(0, 364))
                        ->toDateString(),
                ];
            })
            ->create();
    }
}
