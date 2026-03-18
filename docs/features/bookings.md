# Bookings

## Data flow

```
Frontend (create-booking-dialog.tsx)
  → POST /bookings (Wayfinder: BookingController.store())
  → StoreBookingRequest (validation)
  → BookingController::store()
  → DB::transaction: Booking::create, rooms()->attach, guests()->attach
  → redirect()->back()
```

## Creating a booking

The create booking form is in `resources/js/components/booking/create-booking-dialog.tsx`. It is triggered from `pages/bookings/index.tsx`.

The form collects:
- One or more rooms (`room_ids`)
- Date range (`start`, `end`)
- Booking status (`status`)
- Existing guests (`guest_ids`) — selected via the guest search dropdown
- New guests (`new_guests`) — name + email + optional phone, created inline

## Validation (`app/Http/Requests/StoreBookingRequest.php`)

### Standard rules

| Field | Rules |
|-------|-------|
| `room_ids` | Required array, min 1 item, each must exist in `rooms` |
| `guest_ids` | Nullable array of existing guest IDs |
| `new_guests.*.first_name` | Required when `new_guests` present |
| `new_guests.*.last_name` | Required when `new_guests` present |
| `new_guests.*.email` | Required, valid email |
| `new_guests.*.phone` | Nullable |
| `start` | Required date |
| `end` | Required date, must be after `start` |
| `status` | Required, must be a valid `BookingStatus` int value |

### After-hooks (cross-field validation)

**Guest presence** — at least one of `guest_ids` or `new_guests` must be non-empty. This is checked after standard validation because it spans two fields.

**Room availability** — two separate checks:
1. Any room under `Maintenance` status that overlaps `[start, end]` blocks creation.
2. Any non-Cancelled booking that overlaps `[start, end]` for the same rooms blocks creation.

The overlap query uses `start < requested_end AND end > requested_start` (standard interval overlap).

## Controller (`app/Http/Controllers/BookingController.php`)

`store()` wraps everything in `DB::transaction()`. Inside:
1. Creates the `Booking` record
2. Attaches `room_ids` via the `booking_room` pivot
3. Creates any `new_guests` as `Guest` records, collects their IDs
4. Attaches all guest IDs via the `guest_booking` pivot

On any `\Throwable`, the transaction rolls back and the controller returns `redirect()->back()->withErrors(['booking' => '...'])`.

## Guest search

`SearchGuestsController` (`GET /guests/search`) accepts a `q` query param and returns JSON:

```json
[
  { "id": 1, "first_name": "Jane", "last_name": "Doe", "email": "jane@example.com", "phone": "..." }
]
```

Results are ordered by relevance (name, email match). The frontend uses this for the guest typeahead in the booking dialog.

## Booking statuses

See [data model — BookingStatus enum](../architecture/data-model.md#enums) for all values.

Key behaviors:
- `Maintenance` bookings block rooms even when creating other bookings
- `Cancelled` bookings are ignored in availability checks
- `CheckedIn` / `CheckedOut` appear in today's activity stats on the dashboard

## What's not yet implemented

`BookingController` has stub methods for `show`, `edit`, `update`, `destroy` — these are not yet built.
