<?php

namespace App\Http\Controllers;

use App\Enums\RoomStatus;
use App\Http\Requests\Onboarding\StoreOnboardingBuildingsRequest;
use App\Http\Requests\Onboarding\StoreOnboardingHotelRequest;
use App\Http\Requests\Onboarding\StoreOnboardingRoomsRequest;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomCategory;
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

        // Ensure default categories exist (idempotent)
        foreach (['Single', 'Double', 'Suite', 'Family'] as $name) {
            RoomCategory::firstOrCreate(
                ['name' => $name],
                ['description' => "{$name} room"]
            );
        }

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
        } else {
            $currentStep = 3;
        }

        $categories = RoomCategory::all();

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
            'email' => $request->user()->email,
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

    public function storeRooms(StoreOnboardingRoomsRequest $request): RedirectResponse
    {
        $user = $request->user();
        $hotelId = $user->hotel_id;

        DB::transaction(function () use ($request, $hotelId): void {
            Room::where('hotel_id', $hotelId)->delete();

            foreach ($request->validated('rules') as $rule) {
                $floor = Floor::where('hotel_id', $hotelId)->findOrFail($rule['floor_id']);

                for ($n = $rule['start_number']; $n <= $rule['end_number']; $n++) {
                    Room::create([
                        'hotel_id' => $hotelId,
                        'building_id' => $floor->building_id,
                        'floor_id' => $floor->id,
                        'room_category_id' => $rule['category_id'],
                        'status' => RoomStatus::Available,
                        'code' => (string) $n,
                    ]);
                }
            }
        });

        return redirect()->route('onboarding.show');
    }

    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Guard: a user must own a hotel with at least one room before being
        // marked onboarded. Without this, a direct POST to /onboarding/complete
        // could leave a user "onboarded" with no hotel — which the global
        // tenancy scope would then deny-all on, but better to refuse upfront.
        abort_if($user->hotel_id === null, 422, 'You must create a hotel before completing onboarding.');
        abort_unless($user->hotel->rooms()->exists(), 422, 'You must add at least one room before completing onboarding.');

        $user->update(['onboarded_at' => now()]);

        return redirect()->route('dashboard')->with('status', 'Welcome to DTU Hotel — your hotel is ready.');
    }
}
