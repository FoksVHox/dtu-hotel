# Backend Conventions

## Controllers

### Invokable controllers for single-action routes

When a route maps to exactly one operation, use an invokable (single-action) controller with `__invoke`. This keeps the file small and makes the mapping obvious.

```php
// app/Http/Controllers/DashboardController.php
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // ...
        return Inertia::render('dashboard', [...]);
    }
}

// routes/web.php
Route::get('dashboard', DashboardController::class)->name('dashboard');
```

Use `Route::resource()` for resource controllers (`BookingController`, `RoomController`) where multiple CRUD actions share a controller.

### Keep controllers thin

Controllers should: validate input (via Form Request), call a model/action, return a response. Business logic that is more than a few lines belongs in an action class under `app/Actions/`.

## Form Requests

All user input is validated in Form Request classes — never inline in controllers.

```bash
vendor/bin/sail artisan make:request StoreBookingRequest
```

Form Requests live in `app/Http/Requests/`. Settings-related requests go in `app/Http/Requests/Settings/`.

### Structure

```php
class StoreBookingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'room_ids'   => ['required', 'array', 'min:1'],
            'room_ids.*' => ['required', 'integer', Rule::exists('rooms', 'id')],
            // ...
        ];
    }

    public function messages(): array
    {
        return [
            'room_ids.required' => 'At least one room must be selected.',
        ];
    }

    // Cross-field validation after standard rules pass
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validateGuestsPresent($validator);
                $this->validateRoomAvailability($validator);
            },
        ];
    }
}
```

Use the `after()` hook for cross-field business rules (e.g., "at least one guest required", "room must be available"). Private methods on the request class keep the `after()` closure clean.

## Models

### Relationships always have return types

```php
public function rooms(): BelongsToMany
{
    return $this->belongsToMany(Room::class);
}
```

### Casts in a method

Use the `casts()` method (not the `$casts` property) for type casting:

```php
protected function casts(): array
{
    return [
        'start'  => 'datetime',
        'end'    => 'datetime',
        'status' => BookingStatus::class,
    ];
}
```

### Non-default pivot table names

Laravel generates alphabetically-sorted pivot table names. If a migration uses a different name, document it and pass the table name explicitly:

```php
// Non-default: 'guest_booking' instead of 'booking_guest'
return $this->belongsToMany(Guest::class, 'guest_booking');

// Non-default: 'room_accessory_room' instead of 'room_room_accessory'
return $this->belongsToMany(RoomAccessory::class, 'room_accessory_room');
```

### Eager loading to prevent N+1

Always eager load in controllers when rendering lists:

```php
Room::with(['roomCategory', 'floor'])->get();
Booking::with(['guests', 'rooms.roomCategory', 'rooms.floor'])->get();
```

### Prefer `Model::query()` over facades

```php
// Good
Booking::query()->where('status', BookingStatus::Pending)->get();

// Avoid
DB::table('bookings')->where('status', 1)->get();
```

## Enums

Enums live in `app/Enums/` and are backed by `int`. Case names are TitleCase. Add a `label()` method for human-readable output:

```php
enum BookingStatus: int
{
    case Pending = 1;
    case Confirmed = 2;

    public function label(): string
    {
        return match ($this) {
            self::Pending   => 'Pending',
            self::Confirmed => 'Confirmed',
        };
    }
}
```

## Action classes

Complex queries or multi-step operations are extracted to invokable action classes in `app/Actions/`:

```php
// app/Actions/Dashboard/BuildTodayActivity.php
class BuildTodayActivity
{
    public function __invoke(): array
    {
        // ... queries and calculations
        return ['checkInsToday' => $checkInsToday, ...];
    }
}

// In controller:
'todayActivity' => Inertia::defer(fn () => app(BuildTodayActivity::class)()),
```

Resolve actions via the service container (`app()`) so they can be swapped in tests.

## Database transactions

Use `DB::transaction()` for operations that must be atomic:

```php
DB::transaction(function () use ($validated): void {
    $booking = Booking::query()->create([...]);
    $booking->rooms()->attach($validated['room_ids']);
    $booking->guests()->attach($guestIds);
});
```

## Migrations

When modifying a column, include **all** previously defined attributes or they will be dropped:

```php
// Wrong — drops 'nullable' that was previously set
$table->string('phone')->change();

// Correct — preserves all existing attributes
$table->string('phone')->nullable()->change();
```

## Code style

Run Pint before committing:

```bash
vendor/bin/sail bin pint --dirty --format agent
```

- Always use curly braces for control structures, even single-line bodies
- PHP 8 constructor property promotion in `__construct()`
- PHPDoc blocks for complex types (array shapes); avoid inline comments unless logic is non-obvious
