# Testing

## Framework

This project uses [Pest v4](https://pestphp.com/) with the `pestphp/pest-plugin-laravel` plugin. Tests live in `tests/Feature/` and `tests/Unit/`.

## Running tests

```bash
# All tests
vendor/bin/sail artisan test --compact

# Filter by name
vendor/bin/sail artisan test --compact --filter=BookingCreationTest

# A specific file
vendor/bin/sail artisan test --compact tests/Feature/BookingTest.php
```

Always use `--compact` to keep output readable.

## Creating tests

```bash
# Feature test (most tests should be feature tests)
vendor/bin/sail artisan make:test --pest BookingCreationTest

# Unit test
vendor/bin/sail artisan make:test --pest --unit BookingStatusTest
```

Feature tests live in `tests/Feature/`, unit tests in `tests/Unit/`.

## Test anatomy (Pest)

```php
<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;

it('creates a booking with valid data', function () {
    $user = User::factory()->create();
    $room = Room::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('bookings.store'), [
            'room_ids' => [$room->id],
            'guest_ids' => [],
            'new_guests' => [
                ['first_name' => 'Jane', 'last_name' => 'Doe', 'email' => 'jane@example.com'],
            ],
            'start' => '2026-06-01',
            'end' => '2026-06-05',
            'status' => 1,
        ]);

    $response->assertRedirect();
    expect(Booking::count())->toBe(1);
});
```

## Factories

All models have factories in `database/factories/`. Use them instead of manually creating model instances:

```php
// Good
$booking = Booking::factory()->create();

// Bad
$booking = Booking::query()->create(['start' => ..., 'end' => ..., 'status' => ...]);
```

Check factories for available states before overriding attributes manually. For example, if a factory has a `confirmed()` state, use `Booking::factory()->confirmed()->create()` rather than setting `status` manually.

## CI

Tests run on every push via `.github/workflows/tests.yml` against a real PostgreSQL database (not SQLite). This means:

- You can use PostgreSQL-specific query builder features
- There is no in-memory database shortcut — migrations run for every test suite
- The CI matrix tests PHP 8.4 and 8.5

## What to test

- **Feature tests** for every new controller action — test the full HTTP round-trip
- **Unit tests** for action classes (`app/Actions/`) and enum logic if complex
- Do not test framework behavior (validation message wording, Eloquent internals)
- Do not mock the database — tests hit a real PostgreSQL instance
