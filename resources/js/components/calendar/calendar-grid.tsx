import {
    addDays,
    differenceInCalendarDays,
    eachDayOfInterval,
    format,
    parseISO,
    startOfDay,
} from 'date-fns';
import { useState } from 'react';
import { BookingDetailDialog } from '@/components/calendar/booking-detail-dialog';
import type { CalendarBooking, CalendarRoom } from '@/types/calendar';
import { getBookingStatusConfig } from '@/types/calendar';

interface CalendarGridProps {
    weekStart: Date;
    rooms: CalendarRoom[];
    bookings: CalendarBooking[];
}

interface PositionedBooking {
    booking: CalendarBooking;
    colStart: number;
    colSpan: number;
}

function getBookingsForRoom(
    roomId: number,
    bookings: CalendarBooking[],
    weekStart: Date,
): PositionedBooking[] {
    const weekEnd = addDays(weekStart, 6);

    return bookings
        .filter((b) => b.rooms.some((r) => r.id === roomId))
        .reduce<PositionedBooking[]>((acc, booking) => {
            const bookingStart = startOfDay(parseISO(booking.start));
            const bookingEnd = startOfDay(parseISO(booking.end));

            if (bookingEnd < weekStart || bookingStart > weekEnd) {
                return acc;
            }

            const clampedStart =
                bookingStart < weekStart ? weekStart : bookingStart;
            const clampedEnd = bookingEnd > weekEnd ? weekEnd : bookingEnd;

            const colStart = differenceInCalendarDays(clampedStart, weekStart);
            const colSpan =
                differenceInCalendarDays(clampedEnd, clampedStart) + 1;

            acc.push({ booking, colStart, colSpan });
            return acc;
        }, []);
}

function guestLabel(booking: CalendarBooking): string {
    if (booking.guests.length === 0) {
        return getBookingStatusConfig(booking).label;
    }
    const guest = booking.guests[0];
    return `${guest.first_name} ${guest.last_name}`;
}

export function CalendarGrid({
    weekStart,
    rooms,
    bookings,
}: CalendarGridProps) {
    const days = eachDayOfInterval({
        start: weekStart,
        end: addDays(weekStart, 6),
    });

    const [selectedBooking, setSelectedBooking] =
        useState<CalendarBooking | null>(null);

    return (
        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <table className="w-full table-fixed border-collapse">
                <thead>
                    <tr>
                        <th className="w-[160px] border-r border-b bg-muted/50 px-3 py-2 text-left text-sm font-medium">
                            Room
                        </th>
                        {days.map((day) => (
                            <th
                                key={format(day, 'yyyy-MM-dd')}
                                className="border-b bg-muted/50 px-3 py-2 text-center text-sm font-medium"
                            >
                                {format(day, 'EEE d')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
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

                    {rooms.map((room) => {
                        const positioned = getBookingsForRoom(
                            room.id,
                            bookings,
                            weekStart,
                        );

                        return (
                            <tr key={room.id}>
                                <td className="border-r border-b px-3 py-3 text-sm font-medium whitespace-nowrap">
                                    {room.room_category.name} –{' '}
                                    {room.floor.code}
                                </td>

                                <td colSpan={7} className="border-b p-0">
                                    <div className="relative grid grid-cols-7">
                                        {days.map((day, i) => (
                                            <div
                                                key={format(day, 'yyyy-MM-dd')}
                                                className={`h-14 ${i < 6 ? 'border-r border-dashed' : ''}`}
                                            />
                                        ))}

                                        {positioned.map(
                                            ({
                                                booking,
                                                colStart,
                                                colSpan,
                                            }) => {
                                                const config =
                                                    getBookingStatusConfig(
                                                        booking,
                                                    );

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() =>
                                                            setSelectedBooking(
                                                                booking,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                setSelectedBooking(
                                                                    booking,
                                                                );
                                                            }
                                                        }}
                                                        className="absolute top-1 bottom-1 flex cursor-pointer flex-col justify-center overflow-hidden rounded border px-2 text-xs transition-opacity hover:opacity-80"
                                                        style={{
                                                            left: `${(colStart / 7) * 100}%`,
                                                            width: `${(colSpan / 7) * 100}%`,
                                                            backgroundColor:
                                                                config.bg,
                                                            borderColor:
                                                                config.border,
                                                            color: config.text,
                                                        }}
                                                    >
                                                        <span className="truncate font-medium">
                                                            {guestLabel(
                                                                booking,
                                                            )}
                                                        </span>
                                                        {booking.guests.length >
                                                            0 && (
                                                            <span
                                                                className="truncate text-[10px]"
                                                                style={{
                                                                    color: config.secondary,
                                                                }}
                                                            >
                                                                {config.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <BookingDetailDialog
                booking={selectedBooking}
                open={selectedBooking !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedBooking(null);
                    }
                }}
            />
        </div>
    );
}
