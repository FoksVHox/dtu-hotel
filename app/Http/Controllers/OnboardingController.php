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
        return Inertia::render('onboarding/wizard', [
            'currentStep' => 1,
            'hotel' => null,
            'buildings' => [],
            'categories' => [],
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
