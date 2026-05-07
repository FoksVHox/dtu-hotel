# Housekeeping

Tracks room cleaning state after guest checkout. Staff can view rooms that need cleaning, schedule a cleaning time, and mark rooms as clean.

## Data flow

```
Booking checkout (BookingController::update → status = CheckedOut)
  → rooms().update(status = Cleaning)

Maintenance page (maintenance/index.tsx)
  → GET /maintenance (MaintenanceController)
  → returns rooms where status = Cleaning

Mark as clean (maintenance/index.tsx — "Mark as clean" button)
  → PATCH /rooms/{room} (Wayfinder: RoomController.update())
  → UpdateRoomRequest (validates status, scheduled_cleaning_at)
  → RoomController::update()
  → MaintenanceLog::create(action = 'cleaned')
  → room.update(status = Available)
  → redirect()->back()

Schedule cleaning (maintenance/index.tsx — date/time picker)
  → PATCH /rooms/{room}
  → RoomController::update()
  → room.update(scheduled_cleaning_at = ...)
  → redirect()->back()
```

## Schema

### `rooms` table additions

| Column | Type | Description |
|--------|------|-------------|
| `status` | `tinyint` | `RoomStatus` enum value (default `Available = 1`) |
| `scheduled_cleaning_at` | `timestamp\|null` | Optional time staff plan to clean the room |

### `maintenance_logs` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | PK |
| `room_id` | bigint | FK → `rooms.id` |
| `action` | `varchar` | Currently always `'cleaned'` |
| `performed_at` | `timestamp` | When the action was recorded |
| `created_at`, `updated_at` | timestamps | Standard Laravel timestamps |

Model: `app/Models/MaintenanceLog.php`

## `MaintenanceController` (`app/Http/Controllers/MaintenanceController.php`)

Single invokable controller (`GET /maintenance`). Fetches all rooms with `status = Cleaning`, eager-loading building, floor, and the most recent `CheckedOut` booking (for display of checkout time). Returns `maintenance/index` page with `cleaningRooms` prop:

```
[
  {
    id: number,
    code: string,           // e.g. "A-1-42"
    floor: number,          // integer extracted from floor name
    checked_out_at: string | null,   // ISO 8601, from most recent CheckedOut booking
    scheduled_cleaning_at: string | null  // ISO 8601
  }
]
```

## `RoomController::update()` (`app/Http/Controllers/RoomController.php`)

Handles both cleaning completion and schedule assignment. Request validation via `UpdateRoomRequest`:

| Field | Rules |
|-------|-------|
| `status` | Optional integer, must be a valid `RoomStatus` value |
| `scheduled_cleaning_at` | Optional nullable datetime |

Logic:
1. If `status` is present and the transition is `Cleaning → Available`, a `MaintenanceLog` is created with `action = 'cleaned'` and `performed_at = now()`
2. Room status is updated
3. If `scheduled_cleaning_at` is present (including explicit `null`), it is written to the room

## Maintenance page (`resources/js/pages/maintenance/index.tsx`)

Displays a card-based list of rooms awaiting cleaning. Each card shows:
- Room code and floor number
- Checkout time (from the last `CheckedOut` booking)
- Scheduled cleaning time (if set)
- **"Mark as clean"** button — sends `PATCH { status: RoomStatus.Available }`
- **Date/time picker** — sends `PATCH { scheduled_cleaning_at: '...' }` on change

When no rooms are in `Cleaning` status, an empty state is shown.

## Key behaviors

- Only rooms with `status = Cleaning` appear in the maintenance queue
- Marking a room clean is only logged if it was in `Cleaning` state before the transition — marking an already-`Available` room as available produces no log entry
- `scheduled_cleaning_at` is display-only; it does not trigger any automated status changes
- Checkout → Cleaning transition is driven by `BookingController::update()`, not the maintenance page
