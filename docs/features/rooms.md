# Rooms

## Hierarchy

Rooms are nested within the physical hotel structure:

```
Hotel
  └── Building (code, address, phone)
        └── Floor (code)
              └── Room (room_category_id)
```

Each room belongs to a `RoomCategory` (e.g., "Standard", "Suite"). Floor and building IDs are stored directly on the room for query convenience.

## Room status

Room status is stored as a column on the `rooms` table and managed explicitly (not derived from bookings at query time).

The `RoomStatus` enum defines four states:

| Status | Value | Meaning |
|--------|-------|---------|
| Available | 1 | Ready to receive a guest |
| Occupied | 2 | Guest is currently checked in |
| Cleaning | 3 | Guest has checked out; room needs cleaning |
| OutOfOrder | 4 | Room is under maintenance |

Status transitions happen in two places:

**Booking status changes** (`BookingController::update()`) — when a booking's status changes, all attached rooms are updated:
- `CheckedIn` → rooms set to `Occupied`
- `CheckedOut` → rooms set to `Cleaning`
- `Cancelled` → rooms set to `Available`

**Manual cleaning workflow** (`RoomController::update()`) — staff mark a `Cleaning` room as done, which sets it back to `Available` and creates a `MaintenanceLog` record. See [housekeeping](housekeeping.md) for full details.

The `room-status-badge.tsx` component renders the appropriate badge color for each status.

## Room accessories

Rooms have a many-to-many relationship with `RoomAccessory` via `room_accessory_room`:

```php
// app/Models/Room.php
public function roomAccessories(): BelongsToMany
{
    return $this->belongsToMany(RoomAccessory::class, 'room_accessory_room');
}
```

Accessories are seeded by `ReferenceDataSeeder`. Both `RoomCategory` and `RoomAccessory` use `SoftDeletes`.

## Rooms page (`pages/rooms/index.tsx`)

Renders a table via `rooms-table.tsx` with a status badge column. The table currently shows all rooms in the system.

## RoomController

`index()` returns all rooms with building, floor, and category eager-loaded. Each room is mapped to:
- `id`, `code` (e.g. `A-1-42`), `category`, `floor` (integer), `status` (enum value), `scheduled_cleaning_at`

`update()` handles two independent operations in the same request:
- **Status update** — if `status` is present, transitions the room status and (if transitioning `Cleaning → Available`) creates a `MaintenanceLog` record
- **Scheduling** — if `scheduled_cleaning_at` is present, persists it to the room

See `app/Http/Requests/UpdateRoomRequest.php` for validation rules.

The `create`, `store`, `show`, `edit`, and `destroy` methods are stubs — room management CRUD is not yet fully implemented.

## Adding a new room

Currently rooms are created via seeders. When the room creation form is built, it will POST to `RoomController::store()` with at minimum:

| Field | Required |
|-------|----------|
| `hotel_id` | Yes |
| `building_id` | Yes |
| `floor_id` | Yes |
| `room_category_id` | Yes |

Room accessories are attached separately via the `room_accessory_room` pivot.
