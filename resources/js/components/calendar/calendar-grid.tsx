import type { CalendarBooking, CalendarRoom } from '@/types/calendar';
import { BOOKING_STATUS_LABELS } from '@/types/calendar';

interface CalendarGridProps {
    weekStart: Date;
    rooms: CalendarRoom[];
    bookings: CalendarBooking[];
}

function daysBetween(a: Date, b: Date): number {
    const msPerDay = 86_400_000;
    return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function getDayColumns(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });
}

function formatDayHeader(date: Date): string {
    const day = date.toLocaleString('en-GB', { weekday: 'short' });
    return `${day} ${date.getDate()}`;
}

// Extracts the date portion from an ISO 8601 string (e.g. "2026-02-23T14:00:00Z") and builds a local Date.
// split('T')[0] strips the time part. month - 1 because JS months are 0-indexed (Jan=0, Feb=1, ...).
function parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
}

interface PositionedBooking {
    booking: CalendarBooking;
    colStart: number;
    colSpan: number;
}

// Finds all bookings for a given room and calculates their column position in the 7-day grid.
// A booking may start before or end after the visible week, so we "clamp" it to the week boundaries.
// colStart = which day column the block starts at (0=Monday, 6=Sunday).
// colSpan  = how many day columns the block spans.
function getBookingsForRoom(
    roomId: number,
    bookings: CalendarBooking[],
    weekStart: Date,
): PositionedBooking[] {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return bookings
        .filter((b) => b.rooms.some((r) => r.id === roomId))
        .reduce<PositionedBooking[]>((acc, booking) => {
            const bookingStart = parseDate(booking.start);
            const bookingEnd = parseDate(booking.end);

            // Skip bookings entirely outside the visible week
            if (bookingEnd < weekStart || bookingStart > weekEnd) {
                return acc;
            }

            // Clamp to visible week: if booking started last week, show from Monday; if it ends next week, show until Sunday
            const clampedStart =
                bookingStart < weekStart ? weekStart : bookingStart;
            const clampedEnd = bookingEnd > weekEnd ? weekEnd : bookingEnd;

            const colStart = daysBetween(weekStart, clampedStart);
            const colSpan = daysBetween(clampedStart, clampedEnd) + 1;

            acc.push({ booking, colStart, colSpan });
            return acc;
        }, []);
}

// Returns the display label for a booking block.
// If guests exist, shows the first guest's name. Otherwise falls back to the status label (e.g. "Maintenance").
function guestLabel(booking: CalendarBooking): string {
    if (booking.guests.length === 0) {
        return BOOKING_STATUS_LABELS[booking.status] ?? 'Booking';
    }
    const guest = booking.guests[0];
    return `${guest.first_name} ${guest.last_name}`;
}

export function CalendarGrid({
    weekStart,
    rooms,
    bookings,
}: CalendarGridProps) {
    const days = getDayColumns(weekStart);

    return (
        <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            {/* Fixed-width table: 1 "Room" column + 7 equal day columns */}
            <table className="w-full min-w-[800px] table-fixed border-collapse">
                <thead>
                    {/* Header row: "Room" | Mon 23 | Tue 24 | Wed 25 | ... | Sun 1 */}
                    <tr>
                        <th className="w-[160px] border-r border-b bg-muted/50 px-3 py-2 text-left text-sm font-medium">
                            Room
                        </th>
                        {days.map((day) => (
                            <th
                                key={day.toISOString()}
                                className="border-b bg-muted/50 px-3 py-2 text-center text-sm font-medium"
                            >
                                {formatDayHeader(day)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Empty state when no rooms exist */}
                    {rooms.length === 0 && (
                        <tr>
                            <td
                                colSpan={8}
                                className="px-3 py-12 text-center text-sm text-muted-foreground"
                            >
                                No rooms available.
                            </td>
                        </tr>
                    )}

                    {/* One row per room */}
                    {rooms.map((room) => {
                        const positioned = getBookingsForRoom(
                            room.id,
                            bookings,
                            weekStart,
                        );

                        return (
                            <tr key={room.id}>
                                {/* Room label cell: e.g. "Deluxe – F1" */}
                                <td className="border-r border-b px-3 py-3 text-sm font-medium whitespace-nowrap">
                                    {room.room_category.name} –{' '}
                                    {room.floor.code}
                                </td>

                                {/* Booking area: spans all 7 day columns */}
                                <td colSpan={7} className="border-b p-0">
                                    <div className="relative grid grid-cols-7">
                                        {/* 7 empty cells forming the background grid with dashed day separators */}
                                        {days.map((day, i) => (
                                            <div
                                                key={day.toISOString()}
                                                className={`h-14 ${i < 6 ? 'border-r border-dashed' : ''}`}
                                            />
                                        ))}

                                        {/* Booking blocks positioned absolutely on top of the grid.
                                            left = (colStart / 7) * 100% positions the block at the correct day.
                                            width = (colSpan / 7) * 100% stretches it across the right number of days. */}
                                        {positioned.map(
                                            ({
                                                booking,
                                                colStart,
                                                colSpan,
                                            }) => (
                                                <div
                                                    key={booking.id}
                                                    className="absolute top-1 bottom-1 flex flex-col justify-center overflow-hidden rounded border border-primary/20 bg-primary/10 px-2 text-xs"
                                                    style={{
                                                        left: `${(colStart / 7) * 100}%`,
                                                        width: `${(colSpan / 7) * 100}%`,
                                                    }}
                                                >
                                                    {/* Guest name (or status label for guest-less bookings like maintenance) */}
                                                    <span className="truncate font-medium">
                                                        {guestLabel(booking)}
                                                    </span>
                                                    {/* Status subtitle shown only when there are guests */}
                                                    {booking.guests.length >
                                                        0 && (
                                                        <span className="truncate text-[10px] text-muted-foreground">
                                                            {BOOKING_STATUS_LABELS[
                                                                booking.status
                                                            ] ?? 'Unknown'}
                                                        </span>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
