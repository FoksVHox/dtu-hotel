# Dashboard

## Overview

The dashboard (`pages/dashboard.tsx`) is the main landing page after login. It shows:
- A weekly booking calendar
- Three stat cards (today's activity, room status summary, booking pipeline)

## Data flow

```
GET /dashboard?week_start=2026-03-18
  → DashboardController::__invoke()
  → Inertia::render('dashboard', [
        'rooms'           => Room::with([...]),
        'bookings'        => Booking::with([...])  // for this week
        'weekStart'       => '2026-03-18',
        'todayActivity'   => Inertia::defer(...),
        'roomStatus'      => Inertia::defer(...),
        'bookingPipeline' => Inertia::defer(...),
    ])
```

## Synchronous props

`rooms` and `bookings` are loaded synchronously because the calendar needs them to render on first paint. The bookings query fetches only the current week range:

```php
// app/Http/Controllers/DashboardController.php:27
$bookings = Booking::with(['guests', 'rooms.roomCategory', 'rooms.floor'])
    ->whereHas('rooms', fn ($query) => $query->whereIn('rooms.id', $rooms->pluck('id')))
    ->where('end', '>=', $weekStart)
    ->where('start', '<=', $weekEnd)
    ->get();
```

Week navigation is via the `week_start` query param. The frontend passes this when the user clicks previous/next week arrows.

## Deferred props (stat cards)

The three stat cards use `Inertia::defer()` so they don't block the calendar from rendering. Each deferred prop resolves via a dedicated action class:

| Prop | Action class | What it computes |
|------|-------------|-----------------|
| `todayActivity` | `BuildTodayActivity` | Check-ins/outs today, currently checked in, expected occupancy %, pending confirmations |
| `roomStatus` | `BuildRoomStatus` | Count of rooms per status (available, occupied, cleaning, out of order) |
| `bookingPipeline` | `BuildBookingPipeline` | Bookings grouped by status for a pipeline view |

On the frontend, each card is wrapped in Inertia's `<Deferred>` component with a skeleton fallback:

```tsx
<Deferred data="todayActivity" fallback={<StatCardSkeleton />}>
    <TodayActivityCard activity={todayActivity} />
</Deferred>
```

Skeletons (`components/dashboard/stat-card-skeleton.tsx`) show pulsing placeholders until the deferred request resolves.

## Action classes

### BuildTodayActivity (`app/Actions/Dashboard/BuildTodayActivity.php`)

Returns:
```typescript
{
    checkInsToday: number;       // bookings with start=today, status Confirmed|CheckedIn
    checkOutsToday: number;      // bookings with end=today, status CheckedIn|CheckedOut
    currentlyCheckedIn: number;  // bookings with status=CheckedIn active today
    expectedOccupancy: number;   // % of rooms with active non-cancelled booking today
    pendingConfirmations: number; // bookings with status=Pending
}
```

### BuildRoomStatus (`app/Actions/Dashboard/BuildRoomStatus.php`)

Derives each room's current status from its active bookings. Returns counts per `RoomStatus` value.

### BuildBookingPipeline (`app/Actions/Dashboard/BuildBookingPipeline.php`)

Groups bookings by `BookingStatus` for a pipeline/kanban-style overview.

## Calendar component

The calendar renders a weekly grid (`components/calendar/calendar-grid.tsx`). Bookings are rendered as blocks spanning their start/end dates across room rows.

- `week-header.tsx` — column headers with day names and dates
- `booking-detail-dialog.tsx` — clicking a booking block opens a detail dialog
- `calendar-legend.tsx` — color legend for booking statuses
