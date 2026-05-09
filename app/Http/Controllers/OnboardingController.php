<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\StoreOnboardingBuildingsRequest;
use App\Http\Requests\Onboarding\StoreOnboardingHotelRequest;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function storeHotel(StoreOnboardingHotelRequest $request): RedirectResponse
    {
        $hotel = Hotel::create([
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'phone' => $request->string('phone'),
            'cvr' => $request->string('cvr'),
            'address' => $request->string('address'),
            'currency' => $request->string('currency'),
            'domain' => '',
        ]);

        $request->user()->update(['hotel_id' => $hotel->id]);

        return redirect()->route('onboarding.show');
    }

    public function storeBuildings(StoreOnboardingBuildingsRequest $request): RedirectResponse
    {
        $user = $request->user();
        $hotelId = $user->hotel_id;

        DB::transaction(function () use ($request, $hotelId): void {
            Floor::where('hotel_id', $hotelId)->delete();
            Building::where('hotel_id', $hotelId)->delete();

            foreach ($request->validated('buildings') as $index => $payload) {
                $buildingCode = 'B'.($index + 1);

                $building = Building::create([
                    'hotel_id' => $hotelId,
                    'name' => $payload['name'],
                    'address' => '',
                    'phone' => '',
                    'code' => $buildingCode,
                ]);

                for ($n = 1; $n <= $payload['floors_count']; $n++) {
                    Floor::create([
                        'hotel_id' => $hotelId,
                        'building_id' => $building->id,
                        'name' => "Floor {$n}",
                        'code' => "{$buildingCode}-{$n}",
                    ]);
                }
            }
        });

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
