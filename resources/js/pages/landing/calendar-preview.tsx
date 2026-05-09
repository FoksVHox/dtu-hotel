const ROOMS = ['101', '102', '103', '104', '105'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BOOKINGS = [
    { room: 0, start: 0, length: 3 },
    { room: 1, start: 2, length: 4 },
    { room: 2, start: 4, length: 2 },
    { room: 3, start: 1, length: 3 },
    { room: 4, start: 3, length: 4 },
];

export default function CalendarPreview() {
    return (
        <div className="rounded border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-1 text-xs">
                <div />
                {DAYS.map((d) => (
                    <div key={d} className="text-center text-neutral-400">{d}</div>
                ))}
                {ROOMS.map((room, r) => (
                    <Row key={room} room={room} rowIndex={r} />
                ))}
            </div>
        </div>
    );
}

function Row({ room, rowIndex }: { room: string; rowIndex: number }) {
    const bookings = BOOKINGS.filter((b) => b.room === rowIndex);

    return (
        <>
            <div className="py-2 pr-2 text-right text-neutral-500">{room}</div>
            {Array.from({ length: 7 }).map((_, dayIdx) => {
                const booking = bookings.find((b) => b.start === dayIdx);
                if (booking) {
                    return (
                        <div
                            key={dayIdx}
                            style={{ gridColumn: `span ${booking.length}` }}
                            className="m-0.5 h-6 rounded bg-neutral-200"
                        />
                    );
                }
                if (bookings.some((b) => dayIdx > b.start && dayIdx < b.start + b.length)) {
                    return null;
                }
                return <div key={dayIdx} className="m-0.5 h-6 rounded bg-neutral-50" />;
            })}
        </>
    );
}
