import { useInView } from '@/hooks/use-in-view';
import { useEffect, useState } from 'react';

const STATUSES = ['available', 'occupied', 'cleaning', 'occupied', 'available', 'maintenance', 'available', 'occupied'] as const;
type Status = (typeof STATUSES)[number];

const ROOM_GRID: Status[][] = [
    ['available', 'occupied', 'cleaning', 'occupied', 'available', 'maintenance', 'available', 'occupied'],
    ['occupied', 'available', 'available', 'cleaning', 'occupied', 'available', 'occupied', 'cleaning'],
    ['available', 'cleaning', 'occupied', 'occupied', 'available', 'occupied', 'maintenance', 'available'],
    ['occupied', 'occupied', 'available', 'available', 'cleaning', 'occupied', 'available', 'occupied'],
];

const STATUS_STYLES: Record<Status, string> = {
    available: 'bg-white border-neutral-200',
    occupied: 'bg-neutral-900 border-neutral-900 text-white',
    cleaning: 'bg-neutral-100 border-neutral-300',
    maintenance: 'bg-neutral-50 border-dashed border-neutral-400',
};

const STATUS_DOT: Record<Status, string> = {
    available: 'bg-neutral-300',
    occupied: 'bg-white',
    cleaning: 'bg-neutral-500',
    maintenance: 'bg-neutral-400',
};

export default function ProductShowcase() {
    const { ref, inView } = useInView<HTMLDivElement>();
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 2400);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative border-b border-neutral-200 bg-neutral-50">
            <div ref={ref} className="mx-auto max-w-6xl px-6 py-24 md:py-32">
                <div
                    className={[
                        'flex max-w-3xl flex-col gap-3 transition-all duration-700 ease-out',
                        inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                        At a glance
                    </span>
                    <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                        Every room, every guest, every detail — in one calm view.
                    </h2>
                    <p className="mt-2 max-w-xl text-neutral-600">
                        Live housekeeping status, maintenance flags, and tomorrow's check-ins. No tabs, no spreadsheets.
                    </p>
                </div>

                <div
                    className={[
                        'mt-14 transition-all duration-1000 ease-out',
                        inView ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-8 opacity-0',
                    ].join(' ')}
                >
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
                        {/* mock app chrome */}
                        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <div className="size-2.5 rounded-full bg-neutral-300" />
                                <div className="size-2.5 rounded-full bg-neutral-300" />
                                <div className="size-2.5 rounded-full bg-neutral-300" />
                            </div>
                            <div className="rounded bg-white px-3 py-1 text-[11px] text-neutral-500">
                                dtu-hotel.app/dashboard
                            </div>
                            <div className="w-12" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[14rem_1fr]">
                            {/* mock sidebar */}
                            <aside className="hidden border-r border-neutral-100 bg-white p-4 md:block">
                                <div className="mb-6 flex items-center gap-2 px-2 text-sm font-semibold">
                                    <div className="size-5 rounded bg-black" />
                                    DTU Hotel
                                </div>
                                {[
                                    { label: 'Dashboard', active: true },
                                    { label: 'Bookings' },
                                    { label: 'Rooms' },
                                    { label: 'Guests' },
                                    { label: 'Maintenance' },
                                ].map((it) => (
                                    <div
                                        key={it.label}
                                        className={[
                                            'rounded px-2 py-1.5 text-sm',
                                            it.active ? 'bg-neutral-100 font-medium text-black' : 'text-neutral-500',
                                        ].join(' ')}
                                    >
                                        {it.label}
                                    </div>
                                ))}
                            </aside>

                            <div className="p-6 md:p-8">
                                {/* stat strip */}
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {[
                                        { v: '24', l: 'Rooms' },
                                        { v: '17', l: 'Occupied' },
                                        { v: '4', l: 'Check-outs today' },
                                        { v: '92%', l: 'Occupancy' },
                                    ].map((s, i) => (
                                        <div
                                            key={s.l}
                                            className={[
                                                'rounded-lg border border-neutral-200 bg-white p-4 transition-all duration-700',
                                                inView ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                                            ].join(' ')}
                                            style={{ transitionDelay: inView ? `${300 + i * 80}ms` : '0ms' }}
                                        >
                                            <div className="text-2xl font-semibold tabular-nums tracking-tight">{s.v}</div>
                                            <div className="mt-1 text-xs text-neutral-500">{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* rooms grid */}
                                <div className="mt-8">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-medium">Rooms · Floor 1</span>
                                        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                                            <Legend dot="bg-white border border-neutral-300" label="Available" />
                                            <Legend dot="bg-neutral-900" label="Occupied" />
                                            <Legend dot="bg-neutral-300" label="Cleaning" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-8 gap-2">
                                        {ROOM_GRID.flatMap((row, rowIdx) =>
                                            row.map((status, colIdx) => {
                                                // gently rotate "cleaning" through cells over time
                                                const idx = rowIdx * 8 + colIdx;
                                                const animatedStatus: Status =
                                                    idx === tick % (ROOM_GRID.length * 8) && status === 'available'
                                                        ? 'cleaning'
                                                        : status;
                                                return (
                                                    <div
                                                        key={`${rowIdx}-${colIdx}`}
                                                        className={[
                                                            'flex h-14 flex-col justify-between rounded-md border p-2 text-[10px] font-medium transition-colors duration-500',
                                                            STATUS_STYLES[animatedStatus],
                                                        ].join(' ')}
                                                    >
                                                        <span className="tabular-nums opacity-70">
                                                            {100 + rowIdx * 100 + colIdx + 1}
                                                        </span>
                                                        <div className={['size-1.5 rounded-full', STATUS_DOT[animatedStatus]].join(' ')} />
                                                    </div>
                                                );
                                            }),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Legend({ dot, label }: { dot: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={['size-2 rounded-full', dot].join(' ')} />
            {label}
        </span>
    );
}
