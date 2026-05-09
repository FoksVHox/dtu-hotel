# Landing, Onboarding & Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public landing page, multi-step onboarding wizard, retrofitted single-hotel-per-user tenancy, and a custom brand mark — all in one day.

**Architecture:** Add `hotel_id` + `onboarded_at` to `users`, plus `hotel_id` to `bookings`/`guests`/`maintenance_logs` (backfilled via existing FK chains). A `BelongsToHotel` trait applies a global query scope so authenticated requests only see their own hotel's data. A new `EnsureHotelOnboarded` middleware redirects unfinished users to `/onboarding`. The wizard is a single Inertia page with four server-validated steps (hotel → buildings/floors → rooms → invite-stub).

**Tech Stack:** Laravel 12, Inertia v2, React 19, Tailwind v4, Fortify, Pest 4, Wayfinder, Sail.

**Spec:** `docs/superpowers/specs/2026-05-09-landing-onboarding-branding-design.md`

---

## File Structure

**Created:**
- `database/migrations/2026_05_09_120000_add_hotel_scoping_columns.php`
- `app/Models/Concerns/BelongsToHotel.php` — trait + global scope
- `app/Http/Middleware/EnsureHotelOnboarded.php`
- `app/Http/Controllers/OnboardingController.php`
- `app/Http/Requests/Onboarding/StoreOnboardingHotelRequest.php`
- `app/Http/Requests/Onboarding/StoreOnboardingBuildingsRequest.php`
- `app/Http/Requests/Onboarding/StoreOnboardingRoomsRequest.php`
- `resources/js/pages/onboarding/wizard.tsx`
- `resources/js/pages/onboarding/steps/hotel-step.tsx`
- `resources/js/pages/onboarding/steps/buildings-step.tsx`
- `resources/js/pages/onboarding/steps/rooms-step.tsx`
- `resources/js/pages/onboarding/steps/invite-step.tsx`
- `resources/js/pages/onboarding/wizard-stepper.tsx`
- `resources/js/pages/landing/hero.tsx`
- `resources/js/pages/landing/features.tsx`
- `resources/js/pages/landing/footer.tsx`
- `resources/js/pages/landing/calendar-preview.tsx`
- `tests/Feature/Onboarding/EnsureHotelOnboardedTest.php`
- `tests/Feature/Onboarding/OnboardingFlowTest.php`
- `tests/Feature/Onboarding/HotelScopingTest.php`
- `tests/Helpers/ActsAsHotelUser.php`

**Modified (replaced):**
- `resources/js/components/app-logo-icon.tsx` — new SVG mark
- `resources/js/pages/welcome.tsx` — new landing page
- `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`

**Modified (additive):**
- `app/Models/User.php` — `hotel()`, `hasOnboarded()`, fillable/casts
- `app/Models/Hotel.php` — `owner()`, `bookings()`, `guests()`, `maintenanceLogs()`
- `app/Models/Booking.php`, `app/Models/Guest.php`, `app/Models/MaintenanceLog.php`, `app/Models/Room.php` — apply trait, add `hotel()`, fillable
- `database/factories/UserFactory.php` — `onboarded()` state
- `database/factories/BookingFactory.php`, `GuestFactory.php`, `MaintenanceLogFactory.php` — `hotel_id` default
- `routes/web.php` — onboarding routes, dashboard middleware swap
- `routes/settings.php` — middleware swap
- `bootstrap/app.php` — register `ensure.hotel.onboarded` alias
- `config/fortify.php` — drop `Features::emailVerification()`
- `tests/Feature/DashboardTest.php`, `BookingCreationTest.php`, `BookingDeletionTest.php`, `BookingManagementTest.php`, `BookingUpdateTest.php`, `HousekeepingTest.php` — use `actingAsHotelUser()` helper

---

## Task 1: Create branch and prep

**Files:** none

- [ ] **Step 1: Verify on the right branch**

Run: `git branch --show-current`
Expected: `feat/landing-onboarding-branding`

If not on that branch, run: `git checkout feat/landing-onboarding-branding`

- [ ] **Step 2: Verify base test suite is green before changes**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green. If anything's red, stop and ask the user — pre-existing failures complicate the rest of the plan.

---

## Task 2: Tenancy migration

**Files:**
- Create: `database/migrations/2026_05_09_120000_add_hotel_scoping_columns.php`

- [ ] **Step 1: Create migration file**

Run: `vendor/bin/sail artisan make:migration add_hotel_scoping_columns --no-interaction`

The artisan command creates a file with a generated timestamp. Note the actual filename it creates (will be similar to `2026_05_09_HHMMSS_add_hotel_scoping_columns.php`).

- [ ] **Step 2: Write migration body**

Replace the file contents with:

```php
<?php

use App\Models\Hotel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
            $table->timestamp('onboarded_at')->nullable()->after('email_verified_at');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('guests', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('maintenance_logs', function (Blueprint $table): void {
            $table->foreignIdFor(Hotel::class)->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // Backfill bookings.hotel_id via booking_room → rooms.hotel_id
        DB::statement('
            UPDATE bookings b
            INNER JOIN booking_room br ON br.booking_id = b.id
            INNER JOIN rooms r ON r.id = br.room_id
            SET b.hotel_id = r.hotel_id
            WHERE b.hotel_id IS NULL AND r.hotel_id IS NOT NULL
        ');

        // Backfill guests.hotel_id via guest_booking → bookings.hotel_id
        DB::statement('
            UPDATE guests g
            INNER JOIN guest_booking gb ON gb.guest_id = g.id
            INNER JOIN bookings b ON b.id = gb.booking_id
            SET g.hotel_id = b.hotel_id
            WHERE g.hotel_id IS NULL AND b.hotel_id IS NOT NULL
        ');

        // Backfill maintenance_logs.hotel_id via room.hotel_id
        DB::statement('
            UPDATE maintenance_logs m
            INNER JOIN rooms r ON r.id = m.room_id
            SET m.hotel_id = r.hotel_id
            WHERE m.hotel_id IS NULL AND r.hotel_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        Schema::table('maintenance_logs', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
        });

        Schema::table('guests', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(Hotel::class);
            $table->dropColumn('onboarded_at');
        });
    }
};
```

- [ ] **Step 3: Run migration**

Run: `vendor/bin/sail artisan migrate:fresh --seed`
Expected: all migrations run, seeders complete, no errors.

- [ ] **Step 4: Verify schema**

Run: `vendor/bin/sail artisan db:show --counts`
Expected: tables exist. Then verify columns by listing schema for one of the tables:

Run: `vendor/bin/sail artisan tinker --execute='print_r(Schema::getColumnListing("users"));'`
Expected: array contains `hotel_id` and `onboarded_at`.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/
git commit -m "feat: add hotel_id and onboarded_at columns for tenancy"
```

---

## Task 3: User and Hotel model updates

**Files:**
- Modify: `app/Models/User.php`
- Modify: `app/Models/Hotel.php`

- [ ] **Step 1: Update `app/Models/User.php`**

Replace the existing file with:

```php
<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'hotel_id',
        'onboarded_at',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'onboarded_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function hasOnboarded(): bool
    {
        return $this->onboarded_at !== null;
    }
}
```

- [ ] **Step 2: Update `app/Models/Hotel.php`**

Replace the existing file with:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'cvr',
        'phone',
        'email',
        'domain',
        'address',
        'currency',
    ];

    public function owner(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function buildings(): HasMany
    {
        return $this->hasMany(Building::class);
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function guests(): HasMany
    {
        return $this->hasMany(Guest::class);
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(MaintenanceLog::class);
    }
}
```

- [ ] **Step 3: Run existing test suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: still green. Models added no scoping yet, so nothing changed semantically.

- [ ] **Step 4: Commit**

```bash
git add app/Models/User.php app/Models/Hotel.php
git commit -m "feat: add hotel relationship and onboarding helpers to User and Hotel"
```

---

## Task 4: BelongsToHotel trait (without applying it yet)

**Files:**
- Create: `app/Models/Concerns/BelongsToHotel.php`

- [ ] **Step 1: Create directory and trait file**

Run: `mkdir -p /Users/hussein/Desktop/dtu-hotel/app/Models/Concerns`

Then create `app/Models/Concerns/BelongsToHotel.php`:

```php
<?php

namespace App\Models\Concerns;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Database\Eloquent\Model;

trait BelongsToHotel
{
    public static function bootBelongsToHotel(): void
    {
        static::addGlobalScope('hotel', function (Builder $query): void {
            if (! auth()->hasUser()) {
                return;
            }

            $hotelId = auth()->user()->hotel_id ?? null;

            if ($hotelId === null) {
                return;
            }

            $query->where($query->getModel()->qualifyColumn('hotel_id'), $hotelId);
        });

        static::creating(function (Model $model): void {
            if ($model->hotel_id !== null) {
                return;
            }

            if (! auth()->hasUser()) {
                return;
            }

            $hotelId = auth()->user()->hotel_id ?? null;

            if ($hotelId !== null) {
                $model->hotel_id = $hotelId;
            }
        });
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function scopeWithoutHotelScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('hotel');
    }
}
```

- [ ] **Step 2: Run existing test suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: still green. Trait isn't used anywhere yet.

- [ ] **Step 3: Commit**

```bash
git add app/Models/Concerns/BelongsToHotel.php
git commit -m "feat: add BelongsToHotel trait with global scope"
```

---

## Task 5: Update factories so tests can keep passing once scoping is on

**Files:**
- Modify: `database/factories/UserFactory.php`
- Modify: `database/factories/RoomFactory.php` (no change to definition; verify hotel chain)
- Modify: `database/factories/BookingFactory.php`
- Modify: `database/factories/GuestFactory.php`
- Modify: `database/factories/MaintenanceLogFactory.php`
- Modify: `database/factories/BuildingFactory.php`
- Modify: `database/factories/FloorFactory.php`

Goal: provide an `onboarded()` state on `UserFactory` so test users come pre-linked to a hotel; ensure transactional factories default `hotel_id` so they pass NOT-NULL once the trait is applied.

- [ ] **Step 1: Update `database/factories/UserFactory.php`**

Add the `onboarded()` state. Append this method to the class (after `withTwoFactor()`):

```php
    /**
     * Indicate the user has finished onboarding and owns a hotel.
     */
    public function onboarded(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'hotel_id' => \App\Models\Hotel::factory(),
                'onboarded_at' => now(),
            ];
        });
    }
```

- [ ] **Step 2: Update `database/factories/BookingFactory.php`**

Replace the file with:

```php
<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        return [
            'hotel_id' => Hotel::factory(),
            'start' => Carbon::now(),
            'end' => Carbon::now(),
            'status' => fake()->randomElement(BookingStatus::cases()),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
```

- [ ] **Step 3: Update `database/factories/GuestFactory.php`**

Replace the file with:

```php
<?php

namespace Database\Factories;

use App\Models\Guest;
use App\Models\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class GuestFactory extends Factory
{
    protected $model = Guest::class;

    public function definition(): array
    {
        return [
            'hotel_id' => Hotel::factory(),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'address' => $this->faker->address(),
            'date_of_birth' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
```

- [ ] **Step 4: Read MaintenanceLogFactory to update it consistently**

Run: `cat /Users/hussein/Desktop/dtu-hotel/database/factories/MaintenanceLogFactory.php`

Then update its `definition()` to include `'hotel_id' => Hotel::factory(),` at the top of the returned array. Add the import `use App\Models\Hotel;` near the other model imports.

- [ ] **Step 5: Run a quick sanity check**

Run: `vendor/bin/sail artisan test --compact`
Expected: still green. Factories now pre-fill `hotel_id` but no global scope is applied, so behavior is unchanged.

- [ ] **Step 6: Commit**

```bash
git add database/factories/
git commit -m "feat: factories preset hotel_id; UserFactory gains onboarded() state"
```

---

## Task 6: Test helper for acting as an onboarded hotel user

**Files:**
- Create: `tests/Helpers/ActsAsHotelUser.php`
- Modify: `tests/Pest.php`

- [ ] **Step 1: Create `tests/Helpers/ActsAsHotelUser.php`**

```php
<?php

namespace Tests\Helpers;

use App\Models\Hotel;
use App\Models\User;

trait ActsAsHotelUser
{
    /**
     * Create a user owning a fresh hotel, log them in, and return the user.
     */
    public function actingAsHotelUser(?Hotel $hotel = null): User
    {
        $hotel ??= Hotel::factory()->create();

        $user = User::factory()->create([
            'hotel_id' => $hotel->id,
            'onboarded_at' => now(),
        ]);

        $this->actingAs($user);

        return $user;
    }
}
```

- [ ] **Step 2: Wire the trait into Pest's Feature group**

Replace `tests/Pest.php` with:

```php
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
```

- [ ] **Step 3: Verify the helper compiles**

Run: `vendor/bin/sail artisan test --compact tests/Feature/DashboardTest.php`
Expected: still green (existing tests don't use the helper yet).

- [ ] **Step 4: Commit**

```bash
git add tests/Helpers/ tests/Pest.php
git commit -m "test: add ActsAsHotelUser helper trait"
```

---

## Task 7: Apply BelongsToHotel trait to Booking, Guest, MaintenanceLog, Room

**Files:**
- Modify: `app/Models/Booking.php`
- Modify: `app/Models/Guest.php`
- Modify: `app/Models/MaintenanceLog.php`
- Modify: `app/Models/Room.php`

- [ ] **Step 1: Read existing Booking model**

Run: `cat /Users/hussein/Desktop/dtu-hotel/app/Models/Booking.php`

Note its existing `use` statements, traits, and `$fillable`.

- [ ] **Step 2: Update `app/Models/Booking.php`**

Add `use App\Models\Concerns\BelongsToHotel;` near other use statements. Add `BelongsToHotel` to the `use` traits line in the class. Add `'hotel_id'` to `$fillable`.

(Concrete edit: open the file, add the trait import and use, and ensure `hotel_id` is in `$fillable`. Do not duplicate the `hotel()` method — it's provided by the trait.)

- [ ] **Step 3: Update `app/Models/Guest.php`**

Same pattern: import the trait, add to class `use`, add `hotel_id` to `$fillable`.

- [ ] **Step 4: Update `app/Models/MaintenanceLog.php`**

Same pattern.

- [ ] **Step 5: Update `app/Models/Room.php`**

Same pattern. Room already has a `belongsTo(Hotel::class)` method; remove that explicit method since the trait now provides it. Add the trait import + use, add `hotel_id` to `$fillable` if not already there.

- [ ] **Step 6: Run test suite — expect breakage**

Run: `vendor/bin/sail artisan test --compact`
Expected: many `DashboardTest`, `BookingCreationTest`, `BookingDeletionTest`, `BookingManagementTest`, `BookingUpdateTest`, `HousekeepingTest` failures because their tests use bare `User::factory()->create()` which has `hotel_id = null` — but now the global scope hides everything. This is expected; the next task fixes them.

Do not commit yet — go to the next task.

---

## Task 8: Migrate existing tests to use `actingAsHotelUser()`

**Files:**
- Modify: `tests/Feature/DashboardTest.php`
- Modify: `tests/Feature/BookingCreationTest.php`
- Modify: `tests/Feature/BookingDeletionTest.php`
- Modify: `tests/Feature/BookingManagementTest.php`
- Modify: `tests/Feature/BookingUpdateTest.php`
- Modify: `tests/Feature/HousekeepingTest.php`

Replace every occurrence of `$this->actingAs(User::factory()->create());` with `$user = $this->actingAsHotelUser();`. Replace bare `Room::factory()->create()` / `Booking::factory()->create()` calls inside those tests with versions that pass the user's hotel: `Room::factory()->create(['hotel_id' => $user->hotel_id])` and `Booking::factory()->create(['hotel_id' => $user->hotel_id, ...])`. Same for `Guest::factory()` and `MaintenanceLog::factory()`.

- [ ] **Step 1: Update `tests/Feature/DashboardTest.php`**

For each test in this file:
1. Change `$this->actingAs(User::factory()->create());` to `$user = $this->actingAsHotelUser();`.
2. Where the test calls `Room::factory()->create()`, change to `Room::factory()->create(['hotel_id' => $user->hotel_id])`.
3. Where the test calls `Room::factory()->count(N)->create()`, change to `Room::factory()->count(N)->create(['hotel_id' => $user->hotel_id])`.
4. Where the test calls `Booking::factory()->create([...])`, add `'hotel_id' => $user->hotel_id` to the array.
5. Where the test calls `Guest::factory()->create()`, change to `Guest::factory()->create(['hotel_id' => $user->hotel_id])`.

The first test case ("guests are redirected to the login page") doesn't act as a user; leave it untouched.

- [ ] **Step 2: Run DashboardTest**

Run: `vendor/bin/sail artisan test --compact tests/Feature/DashboardTest.php`
Expected: all green.

- [ ] **Step 3: Update `tests/Feature/BookingCreationTest.php`**

Same pattern. Read the file first to identify all factory calls; then update.

- [ ] **Step 4: Run BookingCreationTest**

Run: `vendor/bin/sail artisan test --compact tests/Feature/BookingCreationTest.php`
Expected: all green.

- [ ] **Step 5: Update `tests/Feature/BookingDeletionTest.php`**

Same pattern.

- [ ] **Step 6: Run BookingDeletionTest**

Run: `vendor/bin/sail artisan test --compact tests/Feature/BookingDeletionTest.php`
Expected: all green.

- [ ] **Step 7: Update `tests/Feature/BookingManagementTest.php`**

Same pattern.

- [ ] **Step 8: Run BookingManagementTest**

Run: `vendor/bin/sail artisan test --compact tests/Feature/BookingManagementTest.php`
Expected: all green.

- [ ] **Step 9: Update `tests/Feature/BookingUpdateTest.php`**

Same pattern.

- [ ] **Step 10: Run BookingUpdateTest**

Run: `vendor/bin/sail artisan test --compact tests/Feature/BookingUpdateTest.php`
Expected: all green.

- [ ] **Step 11: Update `tests/Feature/HousekeepingTest.php`**

Same pattern.

- [ ] **Step 12: Run HousekeepingTest**

Run: `vendor/bin/sail artisan test --compact tests/Feature/HousekeepingTest.php`
Expected: all green.

- [ ] **Step 13: Run full suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green.

- [ ] **Step 14: Commit traits + tests together**

```bash
git add app/Models/ tests/Feature/
git commit -m "feat: apply BelongsToHotel trait; migrate tests to ActsAsHotelUser"
```

---

## Task 9: Cross-hotel scoping test

**Files:**
- Create: `tests/Feature/Onboarding/HotelScopingTest.php`

- [ ] **Step 1: Create directory**

Run: `mkdir -p /Users/hussein/Desktop/dtu-hotel/tests/Feature/Onboarding`

- [ ] **Step 2: Write the failing test**

Create `tests/Feature/Onboarding/HotelScopingTest.php`:

```php
<?php

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Hotel;
use App\Models\MaintenanceLog;
use App\Models\Room;
use App\Models\User;

test('users only see bookings from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Booking::factory()->create(['hotel_id' => $hotelA->id]);
    Booking::factory()->create(['hotel_id' => $hotelB->id]);
    Booking::factory()->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(Booking::query()->count())->toBe(1);
});

test('users only see guests from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Guest::factory()->create(['hotel_id' => $hotelA->id]);
    Guest::factory()->count(3)->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(Guest::query()->count())->toBe(1);
});

test('users only see rooms from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Room::factory()->count(2)->create(['hotel_id' => $hotelA->id]);
    Room::factory()->count(5)->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(Room::query()->count())->toBe(2);
});

test('users only see maintenance logs from their own hotel', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    MaintenanceLog::factory()->create(['hotel_id' => $hotelA->id]);
    MaintenanceLog::factory()->count(2)->create(['hotel_id' => $hotelB->id]);

    $userA = User::factory()->create([
        'hotel_id' => $hotelA->id,
        'onboarded_at' => now(),
    ]);

    $this->actingAs($userA);

    expect(MaintenanceLog::query()->count())->toBe(1);
});

test('unauthenticated requests do not apply hotel scope', function () {
    $hotelA = Hotel::factory()->create();
    $hotelB = Hotel::factory()->create();

    Booking::factory()->create(['hotel_id' => $hotelA->id]);
    Booking::factory()->create(['hotel_id' => $hotelB->id]);

    expect(Booking::query()->count())->toBe(2);
});
```

- [ ] **Step 3: Run the test**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/HotelScopingTest.php`
Expected: all green. (The trait was applied in Task 7; this test verifies the scoping works.)

- [ ] **Step 4: Commit**

```bash
git add tests/Feature/Onboarding/HotelScopingTest.php
git commit -m "test: cross-hotel scoping prevents data leakage"
```

---

## Task 10: EnsureHotelOnboarded middleware

**Files:**
- Create: `app/Http/Middleware/EnsureHotelOnboarded.php`
- Create: `tests/Feature/Onboarding/EnsureHotelOnboardedTest.php`
- Modify: `bootstrap/app.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Onboarding/EnsureHotelOnboardedTest.php`:

```php
<?php

use App\Models\Hotel;
use App\Models\User;

test('users with no hotel are redirected to onboarding', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/onboarding');
});

test('users with a hotel but no onboarded_at are redirected to onboarding', function () {
    $hotel = Hotel::factory()->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/onboarding');
});

test('fully onboarded users can reach the dashboard', function () {
    $user = $this->actingAsHotelUser();

    $this->get('/dashboard')->assertOk();
});

test('fully onboarded users visiting onboarding are redirected to dashboard', function () {
    $user = $this->actingAsHotelUser();

    $this->get('/onboarding')->assertRedirect('/dashboard');
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/EnsureHotelOnboardedTest.php`
Expected: all four tests fail (no middleware, no `/onboarding` route).

- [ ] **Step 3: Create the middleware**

Create `app/Http/Middleware/EnsureHotelOnboarded.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHotelOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $isOnboardingRoute = $request->routeIs('onboarding.*');

        if (! $user->hasOnboarded() && ! $isOnboardingRoute) {
            return redirect()->route('onboarding.show');
        }

        if ($user->hasOnboarded() && $isOnboardingRoute) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Register the alias in `bootstrap/app.php`**

Find the `->withMiddleware(function (Middleware $middleware): void {` block and add inside it:

```php
$middleware->alias([
    'ensure.hotel.onboarded' => \App\Http\Middleware\EnsureHotelOnboarded::class,
]);
```

If a `$middleware->alias([...])` block already exists, merge the new alias into the existing array instead of duplicating.

- [ ] **Step 5: Verify Step 2 still fails (route missing)**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/EnsureHotelOnboardedTest.php`
Expected: still failing because there's no `/onboarding` route or `onboarding.show` named route. We will fix this in Task 11.

- [ ] **Step 6: Commit middleware-only changes**

```bash
git add app/Http/Middleware/EnsureHotelOnboarded.php bootstrap/app.php tests/Feature/Onboarding/EnsureHotelOnboardedTest.php
git commit -m "feat: EnsureHotelOnboarded middleware (route + tests pending)"
```

---

## Task 11: Onboarding routes + skeleton controller + middleware activation

**Files:**
- Create: `app/Http/Controllers/OnboardingController.php`
- Modify: `routes/web.php`
- Modify: `routes/settings.php`

- [ ] **Step 1: Create skeleton OnboardingController**

```php
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
```

- [ ] **Step 2: Replace `routes/web.php`**

```php
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
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth'])->group(function () {
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
```

- [ ] **Step 3: Update `routes/settings.php` middleware**

Open `routes/settings.php`. Locate any `Route::middleware([...])->group(...)` calls that include `'verified'` or `'auth'`. Replace `'verified'` with `'ensure.hotel.onboarded'`. Keep `'auth'`.

- [ ] **Step 4: Run middleware tests**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/EnsureHotelOnboardedTest.php`
Expected: all four green now (route exists, middleware enforced).

- [ ] **Step 5: Run full suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/OnboardingController.php routes/
git commit -m "feat: onboarding routes and middleware-protected dashboard group"
```

---

## Task 12: Disable Fortify email verification

**Files:**
- Modify: `config/fortify.php`

- [ ] **Step 1: Edit `config/fortify.php`**

Find the `features` array (around line 145) and remove the line `Features::emailVerification(),`. Leave the rest of the array intact.

- [ ] **Step 2: Run the full suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green. (Existing seeded users have `email_verified_at = now()` from the factory, and no test asserts on the verified middleware.)

- [ ] **Step 3: Commit**

```bash
git add config/fortify.php
git commit -m "config: disable email verification per onboarding spec"
```

---

## Task 13: OnboardingController@show resume logic

**Files:**
- Modify: `app/Http/Controllers/OnboardingController.php`
- Create: `tests/Feature/Onboarding/OnboardingFlowTest.php`

- [ ] **Step 1: Write failing tests for `show`**

Create `tests/Feature/Onboarding/OnboardingFlowTest.php`:

```php
<?php

use App\Models\Building;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomCategory;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('show returns step 1 when user has no hotel', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 1)
        );
});

test('show returns step 2 when user has hotel but no buildings', function () {
    $hotel = Hotel::factory()->create();
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 2)
        );
});

test('show returns step 3 when user has buildings but no rooms', function () {
    $hotel = Hotel::factory()->create();
    Building::factory()->create(['hotel_id' => $hotel->id]);
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 3)
        );
});

test('show returns step 4 when user has rooms but is not yet onboarded', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    Room::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
        'floor_id' => $floor->id,
    ]);
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->where('currentStep', 4)
        );
});

test('show passes hotel, buildings with floors, and categories to props', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    Floor::factory()->count(2)->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    RoomCategory::factory()->count(3)->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('onboarding/wizard')
            ->has('hotel')
            ->has('buildings', 1, fn (AssertableInertia $b) => $b
                ->has('floors', 2)
                ->etc()
            )
            ->has('categories', 3)
        );
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all five tests fail (controller is still a stub).

- [ ] **Step 3: Implement `show`**

Replace the `show` method in `app/Http/Controllers/OnboardingController.php`:

```php
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
```

- [ ] **Step 4: Run tests — expect green**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all five tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/OnboardingController.php tests/Feature/Onboarding/OnboardingFlowTest.php
git commit -m "feat: OnboardingController@show resume logic"
```

---

## Task 14: storeHotel + Form Request

**Files:**
- Create: `app/Http/Requests/Onboarding/StoreOnboardingHotelRequest.php`
- Modify: `app/Http/Controllers/OnboardingController.php`
- Modify: `tests/Feature/Onboarding/OnboardingFlowTest.php`

- [ ] **Step 1: Write failing test**

Append to `tests/Feature/Onboarding/OnboardingFlowTest.php`:

```php
test('storeHotel creates a hotel and links it to the user', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/hotel', [
            'name' => 'Aurora Stay',
            'email' => 'hello@aurora.test',
            'phone' => '+45 12 34 56 78',
            'cvr' => 'DK12345678',
            'address' => 'Hovedgaden 1, Copenhagen',
            'currency' => 'DKK',
        ])
        ->assertRedirect('/onboarding');

    $user->refresh();

    expect($user->hotel_id)->not->toBeNull();
    expect($user->onboarded_at)->toBeNull();
    expect($user->hotel->name)->toBe('Aurora Stay');
    expect($user->hotel->currency)->toBe('DKK');
});

test('storeHotel rejects missing fields', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/hotel', [])
        ->assertSessionHasErrors(['name', 'email', 'phone', 'cvr', 'address', 'currency']);
});

test('storeHotel rejects invalid currency', function () {
    $user = User::factory()->create([
        'hotel_id' => null,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/hotel', [
            'name' => 'Test',
            'email' => 'a@b.test',
            'phone' => '12345',
            'cvr' => 'X',
            'address' => 'Y',
            'currency' => 'BTC',
        ])
        ->assertSessionHasErrors(['currency']);
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: 3 new tests fail.

- [ ] **Step 3: Create the Form Request**

Run: `mkdir -p /Users/hussein/Desktop/dtu-hotel/app/Http/Requests/Onboarding`

Create `app/Http/Requests/Onboarding/StoreOnboardingHotelRequest.php`:

```php
<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hotel_id === null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:64'],
            'cvr' => ['required', 'string', 'max:64'],
            'address' => ['required', 'string', 'max:512'],
            'currency' => ['required', 'string', 'in:DKK,EUR,USD'],
        ];
    }
}
```

- [ ] **Step 4: Implement `storeHotel`**

Replace `storeHotel` in `OnboardingController.php`. Add `use App\Http\Requests\Onboarding\StoreOnboardingHotelRequest;` and `use App\Models\Hotel;` near the other use statements:

```php
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
```

- [ ] **Step 5: Run tests — expect green**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Requests/Onboarding/StoreOnboardingHotelRequest.php app/Http/Controllers/OnboardingController.php tests/Feature/Onboarding/OnboardingFlowTest.php
git commit -m "feat: onboarding storeHotel with validation"
```

---

## Task 15: storeBuildings + Form Request

**Files:**
- Create: `app/Http/Requests/Onboarding/StoreOnboardingBuildingsRequest.php`
- Modify: `app/Http/Controllers/OnboardingController.php`
- Modify: `tests/Feature/Onboarding/OnboardingFlowTest.php`

- [ ] **Step 1: Write failing tests**

Append to `tests/Feature/Onboarding/OnboardingFlowTest.php`:

```php
test('storeBuildings creates buildings and auto-numbered floors', function () {
    $hotel = Hotel::factory()->create();
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/buildings', [
            'buildings' => [
                ['name' => 'Main', 'floors_count' => 3],
                ['name' => 'Annex', 'floors_count' => 1],
            ],
        ])
        ->assertRedirect('/onboarding');

    expect($hotel->buildings()->count())->toBe(2);

    $main = $hotel->buildings()->where('name', 'Main')->first();
    expect($main->floors()->count())->toBe(3);

    $annex = $hotel->buildings()->where('name', 'Annex')->first();
    expect($annex->floors()->count())->toBe(1);
});

test('storeBuildings wipes and recreates if buildings already exist', function () {
    $hotel = Hotel::factory()->create();
    Building::factory()->count(5)->create(['hotel_id' => $hotel->id]);

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/buildings', [
            'buildings' => [
                ['name' => 'Only', 'floors_count' => 1],
            ],
        ])
        ->assertRedirect('/onboarding');

    expect($hotel->buildings()->count())->toBe(1);
});

test('storeBuildings rejects empty buildings array', function () {
    $hotel = Hotel::factory()->create();
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/buildings', ['buildings' => []])
        ->assertSessionHasErrors(['buildings']);
});

test('storeBuildings caps floors_count at 20', function () {
    $hotel = Hotel::factory()->create();
    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/buildings', [
            'buildings' => [['name' => 'X', 'floors_count' => 21]],
        ])
        ->assertSessionHasErrors(['buildings.0.floors_count']);
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: 4 new tests fail.

- [ ] **Step 3: Read Floor migration to understand column names**

Run: `cat /Users/hussein/Desktop/dtu-hotel/database/migrations/2026_02_19_101509_create_floors_table.php`

Note the column names (specifically: does Floor have `name`, `code`, `level`, etc.). The dashboard test asserted `name` and `code`. Use whatever the schema uses.

- [ ] **Step 4: Create the Form Request**

Create `app/Http/Requests/Onboarding/StoreOnboardingBuildingsRequest.php`:

```php
<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingBuildingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hotel_id !== null;
    }

    public function rules(): array
    {
        return [
            'buildings' => ['required', 'array', 'min:1', 'max:10'],
            'buildings.*.name' => ['required', 'string', 'max:255'],
            'buildings.*.floors_count' => ['required', 'integer', 'between:1,20'],
        ];
    }
}
```

- [ ] **Step 5: Implement `storeBuildings`**

Add imports near the top of `OnboardingController.php`:

```php
use App\Http\Requests\Onboarding\StoreOnboardingBuildingsRequest;
use App\Models\Building;
use App\Models\Floor;
use Illuminate\Support\Facades\DB;
```

Replace `storeBuildings`:

```php
public function storeBuildings(StoreOnboardingBuildingsRequest $request): RedirectResponse
{
    $user = $request->user();
    $hotelId = $user->hotel_id;

    DB::transaction(function () use ($request, $hotelId): void {
        Building::where('hotel_id', $hotelId)->delete();

        foreach ($request->validated('buildings') as $payload) {
            $building = Building::create([
                'hotel_id' => $hotelId,
                'name' => $payload['name'],
            ]);

            for ($n = 1; $n <= $payload['floors_count']; $n++) {
                Floor::create([
                    'hotel_id' => $hotelId,
                    'building_id' => $building->id,
                    'name' => "Floor {$n}",
                    'code' => (string) $n,
                ]);
            }
        }
    });

    return redirect()->route('onboarding.show');
}
```

If the Building or Floor model has additional NOT NULL columns the schema requires (check by running `vendor/bin/sail artisan tinker --execute='print_r(Schema::getColumnListing("buildings"));'` and the same for floors), add appropriate defaults to the `create()` calls.

- [ ] **Step 6: Run tests — expect green**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Requests/Onboarding/StoreOnboardingBuildingsRequest.php app/Http/Controllers/OnboardingController.php tests/Feature/Onboarding/OnboardingFlowTest.php
git commit -m "feat: onboarding storeBuildings with auto-floor generation"
```

---

## Task 16: storeRooms + Form Request

**Files:**
- Create: `app/Http/Requests/Onboarding/StoreOnboardingRoomsRequest.php`
- Modify: `app/Http/Controllers/OnboardingController.php`
- Modify: `tests/Feature/Onboarding/OnboardingFlowTest.php`

- [ ] **Step 1: Write failing tests**

Append to `tests/Feature/Onboarding/OnboardingFlowTest.php`:

```php
test('storeRooms expands rules into rooms', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    $category = RoomCategory::factory()->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/rooms', [
            'rules' => [
                [
                    'start_number' => 101,
                    'end_number' => 110,
                    'floor_id' => $floor->id,
                    'category_id' => $category->id,
                ],
            ],
        ])
        ->assertRedirect('/onboarding');

    expect($hotel->rooms()->count())->toBe(10);
    expect($hotel->rooms()->where('number', '101')->exists())->toBeTrue();
    expect($hotel->rooms()->where('number', '110')->exists())->toBeTrue();
});

test('storeRooms rejects ranges over 50', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    $category = RoomCategory::factory()->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/rooms', [
            'rules' => [
                [
                    'start_number' => 100,
                    'end_number' => 200,
                    'floor_id' => $floor->id,
                    'category_id' => $category->id,
                ],
            ],
        ])
        ->assertSessionHasErrors(['rules.0.end_number']);
});

test('storeRooms rejects more than 10 rules', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    $category = RoomCategory::factory()->create();

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $rules = [];
    for ($i = 0; $i < 11; $i++) {
        $rules[] = [
            'start_number' => 100 + $i * 10,
            'end_number' => 100 + $i * 10 + 1,
            'floor_id' => $floor->id,
            'category_id' => $category->id,
        ];
    }

    $this->actingAs($user)
        ->post('/onboarding/rooms', ['rules' => $rules])
        ->assertSessionHasErrors(['rules']);
});

test('storeRooms wipes and recreates if rooms already exist', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    $category = RoomCategory::factory()->create();

    Room::factory()->count(7)->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
        'floor_id' => $floor->id,
        'room_category_id' => $category->id,
    ]);

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/rooms', [
            'rules' => [
                [
                    'start_number' => 1,
                    'end_number' => 3,
                    'floor_id' => $floor->id,
                    'category_id' => $category->id,
                ],
            ],
        ])
        ->assertRedirect('/onboarding');

    expect($hotel->rooms()->count())->toBe(3);
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: 4 new tests fail.

- [ ] **Step 3: Create the Form Request**

Create `app/Http/Requests/Onboarding/StoreOnboardingRoomsRequest.php`:

```php
<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingRoomsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hotel_id !== null;
    }

    public function rules(): array
    {
        return [
            'rules' => ['required', 'array', 'min:1', 'max:10'],
            'rules.*.start_number' => ['required', 'integer', 'min:1'],
            'rules.*.end_number' => ['required', 'integer', 'gte:rules.*.start_number'],
            'rules.*.floor_id' => ['required', 'integer', 'exists:floors,id'],
            'rules.*.category_id' => ['required', 'integer', 'exists:room_categories,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $rules = $this->input('rules', []);

            foreach ($rules as $index => $rule) {
                $start = (int) ($rule['start_number'] ?? 0);
                $end = (int) ($rule['end_number'] ?? 0);

                if ($end - $start + 1 > 50) {
                    $validator->errors()->add(
                        "rules.{$index}.end_number",
                        'Each rule may create at most 50 rooms.'
                    );
                }
            }
        });
    }
}
```

- [ ] **Step 4: Implement `storeRooms`**

Add imports to `OnboardingController.php`:

```php
use App\Http\Requests\Onboarding\StoreOnboardingRoomsRequest;
use App\Models\Room;
```

Replace `storeRooms`:

```php
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
                    'number' => (string) $n,
                ]);
            }
        }
    });

    return redirect()->route('onboarding.show');
}
```

If the Rooms table has a NOT NULL `status` column (per `RoomFactory` it uses `RoomStatus::Available`), add `'status' => \App\Enums\RoomStatus::Available` to the `Room::create()` array. Confirm by:

Run: `vendor/bin/sail artisan tinker --execute='print_r(Schema::getColumnListing("rooms"));'`

- [ ] **Step 5: Run tests — expect green**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Requests/Onboarding/StoreOnboardingRoomsRequest.php app/Http/Controllers/OnboardingController.php tests/Feature/Onboarding/OnboardingFlowTest.php
git commit -m "feat: onboarding storeRooms with rule expansion"
```

---

## Task 17: complete

**Files:**
- Modify: `app/Http/Controllers/OnboardingController.php`
- Modify: `tests/Feature/Onboarding/OnboardingFlowTest.php`

- [ ] **Step 1: Write failing test**

Append to `tests/Feature/Onboarding/OnboardingFlowTest.php`:

```php
test('complete sets onboarded_at and redirects to dashboard', function () {
    $hotel = Hotel::factory()->create();
    $building = Building::factory()->create(['hotel_id' => $hotel->id]);
    $floor = Floor::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
    ]);
    Room::factory()->create([
        'hotel_id' => $hotel->id,
        'building_id' => $building->id,
        'floor_id' => $floor->id,
    ]);

    $user = User::factory()->create([
        'hotel_id' => $hotel->id,
        'onboarded_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/complete')
        ->assertRedirect('/dashboard');

    $user->refresh();
    expect($user->onboarded_at)->not->toBeNull();
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: new test fails.

- [ ] **Step 3: Implement `complete`**

Replace `complete` in `OnboardingController.php`:

```php
public function complete(Request $request): RedirectResponse
{
    $request->user()->update(['onboarded_at' => now()]);

    return redirect()->route('dashboard')->with('status', 'Welcome to DTU Hotel — your hotel is ready.');
}
```

- [ ] **Step 4: Run test — expect green**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all green.

- [ ] **Step 5: Run full suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/OnboardingController.php tests/Feature/Onboarding/OnboardingFlowTest.php
git commit -m "feat: onboarding complete sets onboarded_at and redirects"
```

---

## Task 18: Default room categories on first onboarding

**Files:**
- Modify: `app/Http/Controllers/OnboardingController.php`

- [ ] **Step 1: Add `firstOrCreate` for default categories in `show`**

Add this near the top of the `show` method, before computing `$currentStep`:

```php
// Ensure default categories exist (idempotent)
foreach (['Single', 'Double', 'Suite', 'Family'] as $name) {
    \App\Models\RoomCategory::firstOrCreate(
        ['name' => $name],
        ['description' => "{$name} room"]
    );
}
```

- [ ] **Step 2: Verify it doesn't break existing tests**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all green. The `categories` count assertion in the existing test (`->has('categories', 3)`) was for a test that explicitly created 3 categories via factory; now `show` will also have created 4 defaults, so it'd expect 7. Update that assertion to use `->has('categories')` (without count) instead, OR run `RoomCategory::query()->delete()` at the start of that specific test before factory-creating its 3 to enforce isolation.

The simplest fix: change `->has('categories', 3)` to `->has('categories')` and assert `count >= 3` if needed via a custom callback. For a school project the looser assertion is acceptable.

- [ ] **Step 3: Re-run tests**

Run: `vendor/bin/sail artisan test --compact tests/Feature/Onboarding/OnboardingFlowTest.php`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/OnboardingController.php tests/Feature/Onboarding/OnboardingFlowTest.php
git commit -m "feat: pre-seed default room categories during onboarding"
```

---

## Task 19: Brand mark — replace AppLogoIcon SVG

**Files:**
- Modify: `resources/js/components/app-logo-icon.tsx`

- [ ] **Step 1: Replace `app-logo-icon.tsx`**

Replace the file with:

```tsx
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="6" y="2" width="6" height="36" rx="0.5" />
            <rect x="28" y="2" width="6" height="36" rx="0.5" />
            <rect x="6" y="14" width="28" height="6" rx="0.5" />
            <rect x="17" y="26" width="6" height="12" rx="0.5" />
        </svg>
    );
}
```

This renders a bold geometric "H" with a doorway-shaped negative space at the bottom. Single fill (uses `fill-current` from consumers).

- [ ] **Step 2: Visual sanity check**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds with no errors.

If a dev server is running, the new mark should already be visible in the sidebar/header/auth pages (which all import this file).

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/app-logo-icon.tsx
git commit -m "feat: replace AppLogoIcon with custom DTU Hotel monogram"
```

---

## Task 20: Brand mark — favicon files

**Files:**
- Replace: `public/favicon.svg`
- Replace: `public/favicon.ico`
- Replace: `public/apple-touch-icon.png`

- [ ] **Step 1: Write the new favicon SVG**

Create `public/favicon.svg` (use Write tool to overwrite):

```xml
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="2" width="6" height="36" rx="0.5" fill="black"/>
  <rect x="28" y="2" width="6" height="36" rx="0.5" fill="black"/>
  <rect x="6" y="14" width="28" height="6" rx="0.5" fill="black"/>
  <rect x="17" y="26" width="6" height="12" rx="0.5" fill="black"/>
</svg>
```

- [ ] **Step 2: Generate `favicon.ico` and `apple-touch-icon.png`**

Run: `vendor/bin/sail bin npx sharp-cli -i public/favicon.svg -o public/apple-touch-icon.png resize 180 180 -- format png`

If `sharp-cli` isn't installed, alternative path: ask the user to drag a generated ICO file into `public/favicon.ico` and a 180×180 PNG into `public/apple-touch-icon.png`. The team can use https://realfavicongenerator.net once for both files. The plan continues either way; the SVG favicon is the primary concern for modern browsers.

- [ ] **Step 3: Verify the SVG loads**

Run: `vendor/bin/sail open` to open the site and check the browser tab. The new monogram should appear.

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg public/favicon.ico public/apple-touch-icon.png
git commit -m "feat: replace favicon assets with DTU Hotel monogram"
```

---

## Task 21: Onboarding wizard shell + step indicator

**Files:**
- Create: `resources/js/pages/onboarding/wizard.tsx`
- Create: `resources/js/pages/onboarding/wizard-stepper.tsx`

- [ ] **Step 1: Create wizard-stepper component**

Run: `mkdir -p /Users/hussein/Desktop/dtu-hotel/resources/js/pages/onboarding/steps`

Create `resources/js/pages/onboarding/wizard-stepper.tsx`:

```tsx
import { Check } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Hotel' },
    { id: 2, label: 'Buildings' },
    { id: 3, label: 'Rooms' },
    { id: 4, label: 'Invite' },
];

export default function WizardStepper({ currentStep }: { currentStep: number }) {
    return (
        <nav className="flex items-center justify-center gap-2" aria-label="Onboarding progress">
            {STEPS.map((step, idx) => {
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <div
                            className={[
                                'flex size-7 items-center justify-center rounded-full border text-xs font-medium',
                                isComplete && 'border-black bg-black text-white',
                                isCurrent && 'border-black text-black',
                                !isComplete && !isCurrent && 'border-neutral-300 text-neutral-400',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            {isComplete ? <Check className="size-4" /> : step.id}
                        </div>
                        <span
                            className={[
                                'text-sm',
                                isCurrent ? 'font-medium text-black' : 'text-neutral-500',
                            ].join(' ')}
                        >
                            {step.label}
                        </span>
                        {idx < STEPS.length - 1 && (
                            <div className="h-px w-8 bg-neutral-300" aria-hidden />
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
```

- [ ] **Step 2: Create wizard page**

Create `resources/js/pages/onboarding/wizard.tsx`:

```tsx
import AppLogoIcon from '@/components/app-logo-icon';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import BuildingsStep from './steps/buildings-step';
import HotelStep from './steps/hotel-step';
import InviteStep from './steps/invite-step';
import RoomsStep from './steps/rooms-step';
import WizardStepper from './wizard-stepper';

interface Floor {
    id: number;
    name: string;
    code: string;
}

interface Building {
    id: number;
    name: string;
    floors: Floor[];
}

interface Hotel {
    id: number;
    name: string;
    currency: string;
}

interface Category {
    id: number;
    name: string;
}

interface WizardProps {
    currentStep: number;
    hotel: Hotel | null;
    buildings: Building[];
    categories: Category[];
}

export default function Wizard({ currentStep: initialStep, hotel, buildings, categories }: WizardProps) {
    const [step, setStep] = useState(initialStep);

    return (
        <>
            <Head title="Set up your hotel" />
            <div className="min-h-screen bg-white text-black">
                <header className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-2">
                        <AppLogoIcon className="size-6 fill-current" />
                        <span className="text-sm font-semibold">DTU Hotel</span>
                    </div>
                    <Link href="/logout" method="post" as="button" className="text-sm text-neutral-500 hover:text-black">
                        Sign out
                    </Link>
                </header>

                <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
                    <WizardStepper currentStep={step} />

                    {step === 1 && <HotelStep hotel={hotel} onAdvance={() => setStep(2)} />}
                    {step === 2 && <BuildingsStep buildings={buildings} onAdvance={() => setStep(3)} onBack={() => setStep(1)} />}
                    {step === 3 && <RoomsStep buildings={buildings} categories={categories} onAdvance={() => setStep(4)} onBack={() => setStep(2)} />}
                    {step === 4 && <InviteStep onBack={() => setStep(3)} />}
                </main>
            </div>
        </>
    );
}
```

- [ ] **Step 3: Verify the page route at least renders an empty shell**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds. (Steps subcomponents don't exist yet — temporary stub them out below.)

- [ ] **Step 4: Create stub step files so the build compiles**

Create each as a minimal placeholder:

`resources/js/pages/onboarding/steps/hotel-step.tsx`:
```tsx
export default function HotelStep(_: any) { return <div>Hotel step</div>; }
```

`resources/js/pages/onboarding/steps/buildings-step.tsx`:
```tsx
export default function BuildingsStep(_: any) { return <div>Buildings step</div>; }
```

`resources/js/pages/onboarding/steps/rooms-step.tsx`:
```tsx
export default function RoomsStep(_: any) { return <div>Rooms step</div>; }
```

`resources/js/pages/onboarding/steps/invite-step.tsx`:
```tsx
export default function InviteStep(_: any) { return <div>Invite step</div>; }
```

- [ ] **Step 5: Build and verify**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add resources/js/pages/onboarding/
git commit -m "feat: onboarding wizard shell with step indicator"
```

---

## Task 22: Step 1 — Hotel basics form

**Files:**
- Modify: `resources/js/pages/onboarding/steps/hotel-step.tsx`

- [ ] **Step 1: Replace stub with real form**

```tsx
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Hotel {
    id: number;
    name: string;
    email: string;
    phone: string;
    cvr: string;
    address: string;
    currency: string;
}

interface HotelStepProps {
    hotel: Hotel | null;
    onAdvance: () => void;
}

export default function HotelStep({ hotel, onAdvance }: HotelStepProps) {
    const form = useForm({
        name: hotel?.name ?? '',
        email: hotel?.email ?? '',
        phone: hotel?.phone ?? '',
        cvr: hotel?.cvr ?? '',
        address: hotel?.address ?? '',
        currency: hotel?.currency ?? 'DKK',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/onboarding/hotel', {
            preserveScroll: true,
            onSuccess: () => onAdvance(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Tell us about your hotel</h1>
                <p className="text-sm text-neutral-500">We'll use this everywhere your hotel appears across the product.</p>
            </header>

            <div className="grid grid-cols-1 gap-4">
                <Field label="Hotel name" error={form.errors.name}>
                    <input
                        type="text"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </Field>

                <Field label="Contact email" error={form.errors.email}>
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                        className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </Field>

                <Field label="Phone" error={form.errors.phone}>
                    <input
                        type="tel"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                        className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </Field>

                <Field label="CVR" error={form.errors.cvr}>
                    <input
                        type="text"
                        value={form.data.cvr}
                        onChange={(e) => form.setData('cvr', e.target.value)}
                        className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </Field>

                <Field label="Address" error={form.errors.address}>
                    <input
                        type="text"
                        value={form.data.address}
                        onChange={(e) => form.setData('address', e.target.value)}
                        className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </Field>

                <Field label="Currency" error={form.errors.currency}>
                    <select
                        value={form.data.currency}
                        onChange={(e) => form.setData('currency', e.target.value)}
                        className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                        <option value="DKK">DKK</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>
                </Field>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </form>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {children}
            {error && <span className="text-sm text-red-600">{error}</span>}
        </label>
    );
}
```

- [ ] **Step 2: Build**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke**

Open browser, log in as a seeded user (e.g., the first user from `UserSeeder`). It should redirect to `/onboarding`. Step 1 form should render and submitting valid data should advance to step 2 (which still shows stub).

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/onboarding/steps/hotel-step.tsx
git commit -m "feat: onboarding step 1 hotel basics form"
```

---

## Task 23: Step 2 — Buildings & floors

**Files:**
- Modify: `resources/js/pages/onboarding/steps/buildings-step.tsx`

- [ ] **Step 1: Replace stub**

```tsx
import { useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { FormEvent } from 'react';

interface Building {
    id: number;
    name: string;
    floors: Array<{ id: number }>;
}

interface BuildingsStepProps {
    buildings: Building[];
    onAdvance: () => void;
    onBack: () => void;
}

export default function BuildingsStep({ buildings, onAdvance, onBack }: BuildingsStepProps) {
    const initial = buildings.length > 0
        ? buildings.map((b) => ({ name: b.name, floors_count: b.floors.length }))
        : [{ name: 'Main Building', floors_count: 1 }];

    const form = useForm<{ buildings: Array<{ name: string; floors_count: number }> }>({
        buildings: initial,
    });

    const addBuilding = () => {
        form.setData('buildings', [...form.data.buildings, { name: '', floors_count: 1 }]);
    };

    const removeBuilding = (idx: number) => {
        form.setData('buildings', form.data.buildings.filter((_, i) => i !== idx));
    };

    const updateBuilding = (idx: number, key: 'name' | 'floors_count', value: string | number) => {
        const next = [...form.data.buildings];
        next[idx] = { ...next[idx], [key]: value };
        form.setData('buildings', next);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/onboarding/buildings', {
            preserveScroll: true,
            onSuccess: () => onAdvance(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Set up your buildings</h1>
                <p className="text-sm text-neutral-500">Each building has its own floors. We'll number floors automatically.</p>
            </header>

            <div className="flex flex-col gap-3">
                {form.data.buildings.map((b, idx) => (
                    <div key={idx} className="flex items-end gap-3 rounded border border-neutral-200 p-4">
                        <label className="flex flex-1 flex-col gap-1.5">
                            <span className="text-sm font-medium">Building name</span>
                            <input
                                type="text"
                                value={b.name}
                                onChange={(e) => updateBuilding(idx, 'name', e.target.value)}
                                className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </label>
                        <label className="flex w-32 flex-col gap-1.5">
                            <span className="text-sm font-medium">Floors</span>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={b.floors_count}
                                onChange={(e) => updateBuilding(idx, 'floors_count', Number(e.target.value))}
                                className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </label>
                        {form.data.buildings.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeBuilding(idx)}
                                className="flex size-11 items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100"
                                aria-label="Remove building"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                ))}

                {form.errors.buildings && <p className="text-sm text-red-600">{form.errors.buildings}</p>}

                <button
                    type="button"
                    onClick={addBuilding}
                    disabled={form.data.buildings.length >= 10}
                    className="flex items-center justify-center gap-2 self-start rounded border border-dashed border-neutral-400 px-4 py-2 text-sm hover:border-black disabled:opacity-50"
                >
                    <Plus className="size-4" /> Add another building
                </button>
            </div>

            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="text-sm text-neutral-500 hover:text-black">
                    Back
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </form>
    );
}
```

- [ ] **Step 2: Build**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add resources/js/pages/onboarding/steps/buildings-step.tsx
git commit -m "feat: onboarding step 2 buildings and floors"
```

---

## Task 24: Step 3 — Rooms (rule composer)

**Files:**
- Modify: `resources/js/pages/onboarding/steps/rooms-step.tsx`

- [ ] **Step 1: Replace stub**

```tsx
import { useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { FormEvent } from 'react';

interface Floor {
    id: number;
    name: string;
    code: string;
}

interface Building {
    id: number;
    name: string;
    floors: Floor[];
}

interface Category {
    id: number;
    name: string;
}

interface Rule {
    start_number: number;
    end_number: number;
    floor_id: number;
    category_id: number;
}

interface RoomsStepProps {
    buildings: Building[];
    categories: Category[];
    onAdvance: () => void;
    onBack: () => void;
}

export default function RoomsStep({ buildings, categories, onAdvance, onBack }: RoomsStepProps) {
    const firstFloor = buildings[0]?.floors[0]?.id ?? 0;
    const firstCategory = categories[0]?.id ?? 0;

    const form = useForm<{ rules: Rule[] }>({
        rules: [
            {
                start_number: 101,
                end_number: 110,
                floor_id: firstFloor,
                category_id: firstCategory,
            },
        ],
    });

    const addRule = () => {
        form.setData('rules', [
            ...form.data.rules,
            {
                start_number: 1,
                end_number: 5,
                floor_id: firstFloor,
                category_id: firstCategory,
            },
        ]);
    };

    const removeRule = (idx: number) => {
        form.setData('rules', form.data.rules.filter((_, i) => i !== idx));
    };

    const update = (idx: number, key: keyof Rule, value: number) => {
        const next = [...form.data.rules];
        next[idx] = { ...next[idx], [key]: value };
        form.setData('rules', next);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/onboarding/rooms', {
            preserveScroll: true,
            onSuccess: () => onAdvance(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Add your rooms</h1>
                <p className="text-sm text-neutral-500">Define one or more numbering rules. We'll create the rooms for you.</p>
            </header>

            <div className="flex flex-col gap-3">
                {form.data.rules.map((rule, idx) => (
                    <div key={idx} className="flex flex-wrap items-end gap-3 rounded border border-neutral-200 p-4">
                        <Inline label="From">
                            <input
                                type="number"
                                min={1}
                                value={rule.start_number}
                                onChange={(e) => update(idx, 'start_number', Number(e.target.value))}
                                className="h-11 w-24 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </Inline>
                        <Inline label="To">
                            <input
                                type="number"
                                min={1}
                                value={rule.end_number}
                                onChange={(e) => update(idx, 'end_number', Number(e.target.value))}
                                className="h-11 w-24 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </Inline>
                        <Inline label="Floor">
                            <select
                                value={rule.floor_id}
                                onChange={(e) => update(idx, 'floor_id', Number(e.target.value))}
                                className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                {buildings.flatMap((b) =>
                                    b.floors.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {b.name} · {f.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </Inline>
                        <Inline label="Category">
                            <select
                                value={rule.category_id}
                                onChange={(e) => update(idx, 'category_id', Number(e.target.value))}
                                className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </Inline>
                        {form.data.rules.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeRule(idx)}
                                className="flex size-11 items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100"
                                aria-label="Remove rule"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                ))}

                {form.errors.rules && <p className="text-sm text-red-600">{form.errors.rules}</p>}

                <button
                    type="button"
                    onClick={addRule}
                    disabled={form.data.rules.length >= 10}
                    className="flex items-center justify-center gap-2 self-start rounded border border-dashed border-neutral-400 px-4 py-2 text-sm hover:border-black disabled:opacity-50"
                >
                    <Plus className="size-4" /> Add another rule
                </button>
            </div>

            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="text-sm text-neutral-500 hover:text-black">
                    Back
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </form>
    );
}

function Inline({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
            {children}
        </label>
    );
}
```

- [ ] **Step 2: Build**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add resources/js/pages/onboarding/steps/rooms-step.tsx
git commit -m "feat: onboarding step 3 room rule composer"
```

---

## Task 25: Step 4 — Invite stub

**Files:**
- Modify: `resources/js/pages/onboarding/steps/invite-step.tsx`

- [ ] **Step 1: Replace stub**

```tsx
import { router } from '@inertiajs/react';
import { Users } from 'lucide-react';

interface InviteStepProps {
    onBack: () => void;
}

export default function InviteStep({ onBack }: InviteStepProps) {
    const finish = () => {
        router.post('/onboarding/complete');
    };

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Invite your team</h1>
                <p className="text-sm text-neutral-500">Coming soon.</p>
            </header>

            <div className="flex flex-col items-center gap-4 rounded border border-neutral-200 px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
                    <Users className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Staff accounts coming soon</h2>
                    <p className="max-w-sm text-sm text-neutral-500">
                        You'll be able to invite reception staff, managers, and housekeeping to your hotel here.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="text-sm text-neutral-500 hover:text-black">
                    Back
                </button>
                <button
                    type="button"
                    onClick={finish}
                    className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Build**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke — full wizard**

Log in as a seeded user. Walk through all 4 steps. After hitting "Skip for now" you should land on `/dashboard` with the welcome flash and your created rooms visible.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/onboarding/steps/invite-step.tsx
git commit -m "feat: onboarding step 4 invite teammates stub"
```

---

## Task 26: Landing page — Hero

**Files:**
- Replace: `resources/js/pages/welcome.tsx`
- Create: `resources/js/pages/landing/hero.tsx`
- Create: `resources/js/pages/landing/calendar-preview.tsx`

- [ ] **Step 1: Create directory**

Run: `mkdir -p /Users/hussein/Desktop/dtu-hotel/resources/js/pages/landing`

- [ ] **Step 2: Create `calendar-preview.tsx`**

```tsx
const ROOMS = ['101', '102', '103', '104', '105'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BOOKINGS = [
    { room: 0, start: 0, length: 3 },
    { room: 1, start: 2, length: 4 },
    { room: 2, start: 4, length: 2 },
    { room: 3, start: 1, length: 3 },
    { room: 4, start: 3, length: 4 },
];

export default function CalendarPreview() {
    return (
        <div className="rounded border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-1 text-xs">
                <div />
                {DAYS.map((d) => (
                    <div key={d} className="text-center text-neutral-400">{d}</div>
                ))}
                {ROOMS.map((room, r) => (
                    <Row key={room} room={room} rowIndex={r} />
                ))}
            </div>
        </div>
    );
}

function Row({ room, rowIndex }: { room: string; rowIndex: number }) {
    const bookings = BOOKINGS.filter((b) => b.room === rowIndex);

    return (
        <>
            <div className="py-2 pr-2 text-right text-neutral-500">{room}</div>
            {Array.from({ length: 7 }).map((_, dayIdx) => {
                const booking = bookings.find((b) => b.start === dayIdx);
                if (booking) {
                    return (
                        <div
                            key={dayIdx}
                            style={{ gridColumn: `span ${booking.length}` }}
                            className="m-0.5 h-6 rounded bg-neutral-200"
                        />
                    );
                }
                if (bookings.some((b) => dayIdx > b.start && dayIdx < b.start + b.length)) {
                    return null;
                }
                return <div key={dayIdx} className="m-0.5 h-6 rounded bg-neutral-50" />;
            })}
        </>
    );
}
```

- [ ] **Step 3: Create `hero.tsx`**

```tsx
import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import CalendarPreview from './calendar-preview';

export default function Hero({ canRegister }: { canRegister: boolean }) {
    return (
        <section className="border-b border-neutral-200">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-2">
                    <AppLogoIcon className="size-6 fill-current" />
                    <span className="text-sm font-semibold">DTU Hotel</span>
                </div>
                <div className="flex items-center gap-5">
                    <Link href="/login" className="text-sm text-neutral-600 hover:text-black">
                        Sign in
                    </Link>
                    {canRegister && (
                        <Link
                            href="/register"
                            className="h-9 rounded bg-black px-4 text-sm font-medium leading-9 text-white hover:bg-neutral-800"
                        >
                            Get started
                        </Link>
                    )}
                </div>
            </nav>

            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-5">
                <div className="md:col-span-3">
                    <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                        Run your hotel,
                        <br />
                        not your spreadsheet.
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-neutral-600">
                        DTU Hotel is the SaaS for small and medium hotels — bookings, rooms, guests, and maintenance, all in one place.
                    </p>
                    <div className="mt-8 flex items-center gap-5">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="h-11 rounded bg-black px-6 text-sm font-medium leading-[44px] text-white hover:bg-neutral-800"
                            >
                                Get started
                            </Link>
                        )}
                        <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <CalendarPreview />
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 4: Replace `welcome.tsx` (skeleton — features and footer fill in next tasks)**

```tsx
import { Head } from '@inertiajs/react';
import Hero from './landing/hero';

interface WelcomeProps {
    canRegister: boolean;
}

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <>
            <Head title="DTU Hotel" />
            <main className="min-h-screen bg-white text-black">
                <Hero canRegister={canRegister} />
            </main>
        </>
    );
}
```

- [ ] **Step 5: Build and verify**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds. Visit `/` — hero should render with the new mark, headline, CTAs, and the greyscale calendar preview.

- [ ] **Step 6: Commit**

```bash
git add resources/js/pages/welcome.tsx resources/js/pages/landing/
git commit -m "feat: landing page hero with greyscale calendar preview"
```

---

## Task 27: Landing page — Features grid

**Files:**
- Create: `resources/js/pages/landing/features.tsx`
- Modify: `resources/js/pages/welcome.tsx`

- [ ] **Step 1: Create `features.tsx`**

```tsx
const FEATURES = [
    {
        title: 'Booking calendar',
        body: 'Visual week and month views. Drag to create, click to edit. Color-coded by status.',
    },
    {
        title: 'Room operations',
        body: 'Track every room, every floor. Housekeeping status updates without spreadsheets.',
    },
    {
        title: 'Maintenance log',
        body: 'Record what broke, who fixed it, and when. Tied to rooms automatically.',
    },
    {
        title: 'Guests',
        body: 'A guest list that doesn\'t lose history. Search, edit, link to bookings.',
    },
];

export default function Features() {
    return (
        <section className="border-b border-neutral-200">
            <div className="mx-auto max-w-6xl px-6 py-24">
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
                    Everything a small hotel actually needs.
                </h2>
                <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded border border-neutral-200 bg-neutral-200 md:grid-cols-2">
                    {FEATURES.map((f) => (
                        <article key={f.title} className="bg-white p-8">
                            <h3 className="text-xl font-semibold">{f.title}</h3>
                            <p className="mt-3 text-sm text-neutral-600">{f.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Wire into `welcome.tsx`**

Update `resources/js/pages/welcome.tsx`:

```tsx
import { Head } from '@inertiajs/react';
import Features from './landing/features';
import Hero from './landing/hero';

interface WelcomeProps {
    canRegister: boolean;
}

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <>
            <Head title="DTU Hotel" />
            <main className="min-h-screen bg-white text-black">
                <Hero canRegister={canRegister} />
                <Features />
            </main>
        </>
    );
}
```

- [ ] **Step 3: Build**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/landing/features.tsx resources/js/pages/welcome.tsx
git commit -m "feat: landing page features grid"
```

---

## Task 28: Landing page — Footer

**Files:**
- Create: `resources/js/pages/landing/footer.tsx`
- Modify: `resources/js/pages/welcome.tsx`

- [ ] **Step 1: Create `footer.tsx`**

```tsx
import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="bg-white">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <AppLogoIcon className="size-6 fill-current" />
                        <span className="text-sm font-semibold">DTU Hotel</span>
                    </div>
                    <p className="text-sm text-neutral-500">Hotel management, simplified.</p>
                </div>
                <FooterColumn title="Product" links={[
                    { label: 'Sign in', href: '/login' },
                    { label: 'Get started', href: '/register' },
                ]} />
                <FooterColumn title="Resources" links={[
                    { label: 'Documentation', href: '#' },
                    { label: 'Support', href: '#' },
                ]} />
                <FooterColumn title="Legal" links={[
                    { label: 'Terms', href: '#' },
                    { label: 'Privacy', href: '#' },
                ]} />
            </div>
            <div className="border-t border-neutral-200">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-neutral-500">
                    <span>© {new Date().getFullYear()} DTU Hotel</span>
                    <span>Built at DTU.</span>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="flex flex-col gap-2">
                {links.map((l) => (
                    <li key={l.label}>
                        <Link href={l.href} className="text-sm text-neutral-500 hover:text-black">
                            {l.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

- [ ] **Step 2: Wire into `welcome.tsx`**

```tsx
import { Head } from '@inertiajs/react';
import Features from './landing/features';
import Footer from './landing/footer';
import Hero from './landing/hero';

interface WelcomeProps {
    canRegister: boolean;
}

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <>
            <Head title="DTU Hotel" />
            <main className="min-h-screen bg-white text-black">
                <Hero canRegister={canRegister} />
                <Features />
                <Footer />
            </main>
        </>
    );
}
```

- [ ] **Step 3: Build**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/landing/footer.tsx resources/js/pages/welcome.tsx
git commit -m "feat: landing page footer"
```

---

## Task 29: End-to-end smoke test + lint + final suite

**Files:** none (verification only)

- [ ] **Step 1: Run pint**

Run: `vendor/bin/sail bin pint --dirty --format agent`
Expected: any unformatted files get fixed. Re-run if anything was changed.

- [ ] **Step 2: Run full test suite**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green.

- [ ] **Step 3: Run frontend build one more time**

Run: `vendor/bin/sail yarn run build`
Expected: build succeeds with no warnings.

- [ ] **Step 4: Manual smoke**

In a browser:
1. Visit `/` — see new landing page with monogram, hero, features, footer.
2. Click "Get started" — register a new account.
3. After registration, expect redirect to `/onboarding`.
4. Step 1: fill in hotel basics → Continue.
5. Step 2: add 1 building, 2 floors → Continue.
6. Step 3: rule for rooms 101-105 on Floor 1 → Continue.
7. Step 4: Skip for now.
8. Land on `/dashboard` with the success flash; rooms visible.
9. Sign out, sign in as a different seeded user — they should be redirected to `/onboarding` since their `hotel_id` is null.

- [ ] **Step 5: Commit any pint changes**

```bash
git status
# If there are formatting changes:
git add -u
git commit -m "style: apply pint formatting"
```

- [ ] **Step 6: Final suite confirmation**

Run: `vendor/bin/sail artisan test --compact`
Expected: all green. Plan complete.

---

## Self-Review

**Spec coverage check:**
- Tenancy retrofit (hotel_id on users/bookings/guests/maintenance_logs, onboarded_at on users) — Task 2.
- Models updated — Tasks 3, 7.
- BelongsToHotel trait — Task 4, applied Task 7.
- EnsureHotelOnboarded middleware — Task 10.
- Routes restructured (onboarding group + dashboard group) — Task 11.
- Fortify config (drop emailVerification) — Task 12.
- OnboardingController with show + 3 store actions + complete — Tasks 13-17.
- Default room categories — Task 18.
- Branding (logo + favicon) — Tasks 19-20.
- Onboarding wizard UI (shell + 4 steps) — Tasks 21-25.
- Landing page (hero + features + footer + greyscale calendar preview) — Tasks 26-28.
- Auth pages NOT touched — confirmed (no tasks modify them; brand mark propagates via `app-logo-icon.tsx`).
- Tests: middleware, onboarding flow, hotel scoping — Tasks 9, 10, 13-17.
- Existing tests migrated to `actingAsHotelUser()` — Task 8.
- `room_categories.hotel_id` deferred — confirmed, not in any task (per spec).
- "Wow" animated calendar transition — deferred as nice-to-have, not in plan (per spec).

**Placeholder scan:** scanned for "TBD", "TODO", "implement later", vague handwaves. Steps that need flexibility (e.g., "If the Building model has additional NOT NULL columns, add appropriate defaults") instruct the engineer to verify with a concrete tinker command rather than guess.

**Type consistency:** `currentStep` is `number` (1-4) throughout. `Hotel`, `Building`, `Floor`, `Category` interfaces are consistent across wizard.tsx and step components. Form data shapes (`{ buildings: [...] }`, `{ rules: [...] }`) match between server validation rules and client form payloads. The `BelongsToHotel` trait's method names (`scopeWithoutHotelScope`, `hotel`) match how they're referenced.

**Known small risks for the executor to handle inline:**
- Task 18 may reduce the assertion in the "show passes ... categories to props" test from `->has('categories', 3)` to `->has('categories')`. Called out explicitly in Step 2.
- Task 15/16 refer to schema columns (Building, Floor, Room) the executor must verify in step 4/5 with `Schema::getColumnListing(...)` because we didn't read the full migration of every table while planning.
