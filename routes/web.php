<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SearchGuestsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'ensure.hotel.onboarded'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('onboarding/hotel', [OnboardingController::class, 'storeHotel'])->name('onboarding.hotel');
    Route::post('onboarding/buildings', [OnboardingController::class, 'storeBuildings'])->name('onboarding.buildings');
    Route::post('onboarding/rooms', [OnboardingController::class, 'storeRooms'])->name('onboarding.rooms');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
});

Route::middleware(['auth', 'ensure.hotel.onboarded'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('bookings', BookingController::class);

    Route::resource('rooms', RoomController::class);

    Route::get('guests/search', SearchGuestsController::class)->name('guests.search');

    Route::get('maintenance', MaintenanceController::class)->name('maintenance.index');
});

require __DIR__.'/settings.php';
