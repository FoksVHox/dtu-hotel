<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Helpers\ActsAsHotelUser;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class, ActsAsHotelUser::class)
    ->in('Feature');

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

function something()
{
    // ..
}
