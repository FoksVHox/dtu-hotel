<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // User::factory(10)->create();
        User::factory()->createMany([
            [
                'name' => 'Lauritz',
                'email' => 'lauritz@test.com',
                'password' => bcrypt('password'),
            ],
            [
                'name' => 'Jimmi',
                'email' => 'jimmi@test.com',
                'password' => bcrypt('password'),
            ],
            [
                'name' => 'Daniall',
                'email' => 'daniall@test.com',
                'password' => bcrypt('password'),
            ],
            [
                'name' => 'Benjamin',
                'email' => 'benjamin@test.com',
                'password' => bcrypt('password'),
            ],
            [
                'name' => 'Hussein',
                'email' => 'hussein@test.com',
                'password' => bcrypt('password'),
            ],
            [
                'name' => 'Mohammad',
                'email' => 'mohammed@testcom',
                'password' => bcrypt('password'),
            ],
        ]);
    }
}
