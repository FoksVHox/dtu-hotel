<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        $hotel = $user->hotel;
        $buildings = $hotel
            ? $hotel->buildings()->with('floors')->get()
            : collect();
        $rooms = $hotel
            ? $hotel->rooms()->limit(1)->get()
            : collect();

        if ($user->hotel_id === null) {
            $currentStep = 1;
        } elseif ($buildings->isEmpty()) {
            $currentStep = 2;
        } elseif ($rooms->isEmpty()) {
            $currentStep = 3;
        } else {
            $currentStep = 4;
        }

        $categories = \App\Models\RoomCategory::query()->get();

        return Inertia::render('onboarding/wizard', [
            'currentStep' => $currentStep,
            'hotel' => $hotel,
            'buildings' => $buildings,
            'categories' => $categories,
        ]);
    }

    public function storeHotel(Request $request): RedirectResponse
    {
        return redirect()->route('onboarding.show');
    }

    public function storeBuildings(Request $request): RedirectResponse
    {
        return redirect()->route('onboarding.show');
    }

    public function storeRooms(Request $request): RedirectResponse
    {
        return redirect()->route('onboarding.show');
    }

    public function complete(Request $request): RedirectResponse
    {
        return redirect()->route('dashboard');
    }
}
