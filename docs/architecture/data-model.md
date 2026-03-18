# Data Model

## Entity overview

```
Hotel
  └── Building (hotel_id)
        └── Floor (hotel_id, building_id)
              └── Room (hotel_id, building_id, floor_id, room_category_id)
                    ├── RoomCategory (many-to-one)
                    ├── RoomAccessory (many-to-many via room_accessory_room)
                    └── Booking (many-to-many via booking_room)
                          └── Guest (many-to-many via guest_booking)
```

## Models

### Hotel (`app/Models/Hotel.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | |
| cvr | string | Danish business registration number |
| phone | string | |
| email | string | |
| domain | string | |
| address | string | |
| currency | string | |

Relations: `hasMany` Buildings, Floors, Rooms.

### Building (`app/Models/Building.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | |
| address | string | |
| phone | string | |
| code | string | Short identifier |
| hotel_id | FK | |

Relations: `belongsTo` Hotel; `hasMany` Floors, Rooms.

### Floor (`app/Models/Floor.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | |
| code | string | Short identifier |
| building_id | FK | |
| hotel_id | FK | Denormalized for convenience |

Relations: `belongsTo` Building, Hotel; `hasMany` Rooms.

### Room (`app/Models/Room.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| hotel_id | FK | |
| building_id | FK | |
| floor_id | FK | |
| room_category_id | FK | |

Relations: `belongsTo` Hotel, Building, Floor, RoomCategory; `belongsToMany` RoomAccessory (via `room_accessory_room`), Booking (via `booking_room`).

Note: Room does not have a `status` database column. Status is derived from active bookings at query time.

### RoomCategory (`app/Models/RoomCategory.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | e.g. "Standard", "Suite" |
| description | text | |
| deleted_at | timestamp | SoftDeletes |

Relations: `hasMany` Rooms.

### RoomAccessory (`app/Models/RoomAccessory.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | e.g. "TV", "Minibar" |
| description | text | |
| deleted_at | timestamp | SoftDeletes |

Relations: `belongsToMany` Rooms (via `room_accessory_room`).

### Booking (`app/Models/Booking.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| start | datetime | Cast to Carbon; serialized as ISO 8601 in JSON |
| end | datetime | Cast to Carbon; serialized as ISO 8601 in JSON |
| status | integer | Cast to `BookingStatus` enum |

Relations: `belongsToMany` Rooms (via `booking_room`), Guests (via `guest_booking`).

The `guest_booking` pivot table uses a non-default name (Laravel's default would be `booking_guest`). The relationship explicitly specifies the table name:
```php
// app/Models/Booking.php:28
return $this->belongsToMany(Guest::class, 'guest_booking');
```

### Guest (`app/Models/Guest.php`)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| first_name | string | |
| last_name | string | |
| phone | string | |
| email | string | |
| address | string | |
| date_of_birth | date | Cast to Carbon date |

Relations: `belongsToMany` Bookings (via `guest_booking`).

### User (`app/Models/User.php`)

Standard Laravel user model with Fortify's `TwoFactorAuthenticatable` trait added.

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | |
| email | string | unique |
| email_verified_at | timestamp | nullable |
| password | string | hashed |
| two_factor_secret | text | nullable, hidden |
| two_factor_recovery_codes | text | nullable, hidden |
| two_factor_confirmed_at | timestamp | nullable |
| remember_token | string | |

## Pivot tables

| Table | Connects | Extra columns |
|-------|----------|---------------|
| `booking_room` | bookings ↔ rooms | none |
| `guest_booking` | guests ↔ bookings | none |
| `room_accessory_room` | rooms ↔ room_accessories | none |

Note: `room_accessory_room` is also non-default (Laravel would generate `room_room_accessory`). The Room model specifies it explicitly:
```php
// app/Models/Room.php:44
return $this->belongsToMany(RoomAccessory::class, 'room_accessory_room');
```

## Enums

### BookingStatus (`app/Enums/BookingStatus.php`)

```php
enum BookingStatus: int {
    case Unknown    = 0;
    case Pending    = 1;
    case Confirmed  = 2;
    case CheckedIn  = 3;
    case CheckedOut = 4;
    case Cancelled  = 5;
    case Maintenance = 6;
}
```

`Maintenance` is a special status used to block rooms during maintenance windows. Booking availability checks treat it differently from regular bookings — a maintenance booking always blocks the room, while `Cancelled` bookings are ignored.

### RoomStatus (`app/Enums/RoomStatus.php`)

```php
enum RoomStatus: int {
    case Available  = 1;
    case Occupied   = 2;
    case Cleaning   = 3;
    case OutOfOrder = 4;
}
```

`RoomStatus` is not stored on the `rooms` table. It is computed from booking state in `BuildRoomStatus` and passed to the frontend as derived data.

## Seeder order

`DatabaseSeeder` calls seeders in dependency order:
1. `UserSeeder` — test users
2. `ReferenceDataSeeder` — room categories and accessories
3. `HotelStructureSeeder` — hotels, buildings, floors, rooms
4. `GuestSeeder` — test guests
5. `BookingSeeder` — bookings referencing rooms and guests
