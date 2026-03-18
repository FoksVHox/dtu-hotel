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

Room status is **not stored** in the database. It is derived from active bookings at query time.

The `RoomStatus` enum defines four states:

| Status | Value | Meaning |
|--------|-------|---------|
| Available | 1 | No active booking |
| Occupied | 2 | Has a `CheckedIn` booking now |
| Cleaning | 3 | Has a `CheckedOut` booking today |
| OutOfOrder | 4 | Has a `Maintenance` booking now |

`BuildRoomStatus` (`app/Actions/Dashboard/BuildRoomStatus.php`) computes this for the dashboard. The `room-status-badge.tsx` component renders the appropriate badge color.

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

`RoomController` has a working `index()` action. The `create`, `store`, `show`, `edit`, `update`, and `destroy` methods are stubs — room management CRUD is not yet fully implemented.

## Adding a new room

Currently rooms are created via seeders. When the room creation form is built, it will POST to `RoomController::store()` with at minimum:

| Field | Required |
|-------|----------|
| `hotel_id` | Yes |
| `building_id` | Yes |
| `floor_id` | Yes |
| `room_category_id` | Yes |

Room accessories are attached separately via the `room_accessory_room` pivot.
