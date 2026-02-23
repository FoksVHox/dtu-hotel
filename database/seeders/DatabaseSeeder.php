<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /*
    TODO: Brugere til os alle

    Prioritet:

    */
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ReferenceDataSeeder::class,
            HotelStructureSeeder::class,
            GuestSeeder::class,
            BookingSeeder::class,
        ]);
    }
}
