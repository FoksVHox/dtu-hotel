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

### `store()`

Wraps everything in `DB::transaction()`. Inside:
1. Creates the `Booking` record
2. Attaches `room_ids` via the `booking_room` pivot
3. Creates any `new_guests` as `Guest` records, collects their IDs
4. Attaches all guest IDs via the `guest_booking` pivot

On any `\Throwable`, the transaction rolls back and the controller returns `redirect()->back()->withErrors(['booking' => '...'])`.

### `update()`

Data flow:
```
Frontend (bookings/index.tsx — Select dropdown)
  → PATCH /bookings/{booking} (Wayfinder: BookingController.update())
  → UpdateBookingRequest (validates status is a valid BookingStatus int)
  → BookingController::update()
  → DB::transaction: booking.update(status), rooms().update(status)
  → redirect()->back()
```

Accepts a `status` integer (validated against `BookingStatus` cases). Updates the booking status and propagates room status changes:

| New booking status | Room status set to |
|--------------------|--------------------|
| `CheckedIn` | `Occupied` |
| `CheckedOut` | `Cleaning` |
| `Cancelled` | `Available` |
| Any other | No change |

Validation: `app/Http/Requests/UpdateBookingRequest.php` — `status` must be a valid `BookingStatus` value.

### `destroy()`

Data flow:
```
Frontend (bookings/index.tsx — Delete button + confirmation dialog)
  → DELETE /bookings/{booking} (Wayfinder: BookingController.destroy())
  → BookingController::destroy()
  → Status check → booking.delete()
  → redirect()->back()
```

Only bookings with status `Pending`, `Confirmed`, or `Cancelled` can be deleted. Attempting to delete a `CheckedIn`, `CheckedOut`, or `Maintenance` booking returns `redirect()->back()->withErrors(['booking' => '...'])`.

## Booking Management page (`resources/js/pages/bookings/index.tsx`)

The main booking management UI. Renders:

- **Stat cards** — total, checked-in, active (Pending + Confirmed), and cancelled counts
- **Sortable table** — sortable by check-in date, check-out date, primary guest name, room count, or status
- **Inline status select** — PATCH to `update()` directly from the table row
- **Delete button** — disabled for non-deletable statuses; triggers a confirmation dialog before DELETE
- **Row click** — opens `BookingDetailDialog` for a read-only detail view

### `BookingStatusBadge` (`resources/js/components/booking-status-badge.tsx`)

Renders a color-coded `Badge` for a given numeric status value. Used in both the management table and the detail dialog. Status-to-color mapping:

| Status | Color |
|--------|-------|
| Pending | Blue |
| Confirmed | Cyan |
| Checked In | Green |
| Checked Out | Zinc |
| Cancelled | Red |
| Maintenance | Amber |

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
- Updating a booking to `CheckedIn`, `CheckedOut`, or `Cancelled` automatically updates the status of all attached rooms (see `update()` above)

## What's not yet implemented

`BookingController` has stub methods for `show` and `edit` — these are not yet built.
