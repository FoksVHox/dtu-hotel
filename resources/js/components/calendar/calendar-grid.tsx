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

function parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

interface PositionedBooking {
    booking: CalendarBooking;
    colStart: number;
    colSpan: number;
}

function getBookingsForRoom(roomId: number, bookings: CalendarBooking[], weekStart: Date): PositionedBooking[] {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return bookings
        .filter((b) => b.rooms.some((r) => r.id === roomId))
        .reduce<PositionedBooking[]>((acc, booking) => {
            const bookingStart = parseDate(booking.start);
            const bookingEnd = parseDate(booking.end);

            if (bookingEnd < weekStart || bookingStart > weekEnd) {
                return acc;
            }

            const clampedStart = bookingStart < weekStart ? weekStart : bookingStart;
            const clampedEnd = bookingEnd > weekEnd ? weekEnd : bookingEnd;

            const colStart = daysBetween(weekStart, clampedStart);
            const colSpan = daysBetween(clampedStart, clampedEnd) + 1;

            acc.push({ booking, colStart, colSpan });
            return acc;
        }, []);
}

function guestLabel(booking: CalendarBooking): string {
    if (booking.guests.length === 0) {
        return BOOKING_STATUS_LABELS[booking.status] ?? 'Booking';
    }
    const guest = booking.guests[0];
    return `${guest.first_name} ${guest.last_name}`;
}

export function CalendarGrid({ weekStart, rooms, bookings }: CalendarGridProps) {
    const days = getDayColumns(weekStart);

    return (
        <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <table className="min-w-[800px] w-full table-fixed border-collapse">
                <thead>
                    <tr>
                        <th className="bg-muted/50 border-b border-r px-3 py-2 text-left text-sm font-medium w-[160px]">
                            Room
                        </th>
                        {days.map((day) => (
                            <th
                                key={day.toISOString()}
                                className="bg-muted/50 border-b px-3 py-2 text-center text-sm font-medium"
                            >
                                {formatDayHeader(day)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rooms.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                                No rooms available.
                            </td>
                        </tr>
                    )}
                    {rooms.map((room) => {
                        const positioned = getBookingsForRoom(room.id, bookings, weekStart);

                        return (
                            <tr key={room.id}>
                                <td className="border-b border-r px-3 py-3 text-sm font-medium whitespace-nowrap">
                                    {room.room_category.name} – {room.floor.code}
                                </td>
                                <td colSpan={7} className="border-b p-0">
                                    <div className="relative grid grid-cols-7">
                                        {days.map((day, i) => (
                                            <div
                                                key={day.toISOString()}
                                                className={`h-14 ${i < 6 ? 'border-r border-dashed' : ''}`}
                                            />
                                        ))}

                                        {positioned.map(({ booking, colStart, colSpan }) => (
                                            <div
                                                key={booking.id}
                                                className="bg-primary/10 border-primary/20 absolute top-1 bottom-1 flex flex-col justify-center overflow-hidden rounded border px-2 text-xs"
                                                style={{
                                                    left: `${(colStart / 7) * 100}%`,
                                                    width: `${(colSpan / 7) * 100}%`,
                                                }}
                                            >
                                                <span className="truncate font-medium">{guestLabel(booking)}</span>
                                                {booking.guests.length > 0 && (
                                                    <span className="text-muted-foreground truncate text-[10px]">
                                                        {BOOKING_STATUS_LABELS[booking.status] ?? 'Unknown'}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
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
