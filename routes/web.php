<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('bookings', function () {
        return Inertia::render('bookings/index');
    })->name('bookings.index');

    Route::get('rooms', function () {
        return Inertia::render('rooms/index');
    })->name('rooms.index');

    Route::get('maintenance', function () {
        return Inertia::render('maintenance/index');
    })->name('maintenance.index');
});

require __DIR__.'/settings.php';
