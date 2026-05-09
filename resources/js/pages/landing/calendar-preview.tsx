import { useEffect, useState } from 'react';

const ROOMS = ['101', '102', '103', '104', '105', '106'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Booking {
    room: number;
    start: number;
    length: number;
    guest: string;
}

const BOOKINGS: Booking[] = [
    { room: 0, start: 0, length: 3, guest: 'Andersen' },
    { room: 1, start: 2, length: 4, guest: 'Müller' },
    { room: 2, start: 4, length: 2, guest: 'Pedersen' },
    { room: 3, start: 1, length: 3, guest: 'Hansen' },
    { room: 4, start: 3, length: 4, guest: 'Lopez' },
    { room: 5, start: 5, length: 2, guest: 'Tanaka' },
];

export default function CalendarPreview() {
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleCount((c) => {
                if (c >= BOOKINGS.length) {
                    clearInterval(interval);
                    return c;
                }
                return c + 1;
            });
        }, 220);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-neutral-100 to-transparent" />
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="size-2 rounded-full bg-neutral-300" />
                            <div className="size-2 rounded-full bg-neutral-300" />
                            <div className="size-2 rounded-full bg-neutral-300" />
                        </div>
                        <span className="ml-2 text-xs text-neutral-400">Week of 11 May</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                        {visibleCount} of {BOOKINGS.length} bookings
                    </div>
                </div>
                <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-1 p-3 text-xs">
                    <div />
                    {DAYS.map((d) => (
                        <div key={d} className="pb-2 text-center font-medium text-neutral-400">
                            {d}
                        </div>
                    ))}

                    {ROOMS.map((room, r) => {
                        const bookings = BOOKINGS.filter((b) => b.room === r);
                        const cells: React.ReactNode[] = [
                            <div
                                key={`label-${r}`}
                                className="flex items-center justify-end pr-2 text-neutral-500 tabular-nums"
                            >
                                {room}
                            </div>,
                        ];

                        let dayIdx = 0;
                        while (dayIdx < 7) {
                            const booking = bookings.find((b) => b.start === dayIdx);
                            if (booking) {
                                const idx = BOOKINGS.indexOf(booking);
                                const visible = idx < visibleCount;
                                cells.push(
                                    <div
                                        key={`b-${r}-${dayIdx}`}
                                        style={{ gridColumn: `span ${booking.length}` }}
                                        className={[
                                            'relative m-0.5 flex h-6 items-center overflow-hidden rounded px-2 text-[10px] font-medium transition-all duration-500 ease-out',
                                            visible
                                                ? 'translate-y-0 bg-neutral-900 text-white opacity-100'
                                                : '-translate-y-1 bg-neutral-200 opacity-0',
                                        ].join(' ')}
                                    >
                                        <span className="truncate">{booking.guest}</span>
                                    </div>,
                                );
                                dayIdx += booking.length;
                            } else {
                                cells.push(
                                    <div key={`e-${r}-${dayIdx}`} className="m-0.5 h-6 rounded bg-neutral-50" />,
                                );
                                dayIdx += 1;
                            }
                        }
                        return cells;
                    })}
                </div>
            </div>
        </div>
    );
}
