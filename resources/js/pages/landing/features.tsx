import { useInView } from '@/hooks/use-in-view';
import { CalendarDays, ClipboardList, Users2, Wrench } from 'lucide-react';

const FEATURES = [
    {
        icon: CalendarDays,
        title: 'Booking calendar',
        body: 'Visual week view with drag-to-create. Color-coded by status. Click anywhere empty to create a booking.',
        sample: <CalendarSample />,
    },
    {
        icon: ClipboardList,
        title: 'Room operations',
        body: 'Track every room and floor. Housekeeping picks up status updates without spreadsheets or radios.',
        sample: <RoomOpsSample />,
    },
    {
        icon: Wrench,
        title: 'Maintenance log',
        body: 'Record what broke, who fixed it, and when. Tied to rooms automatically and surfaced on the dashboard.',
        sample: <MaintenanceSample />,
    },
    {
        icon: Users2,
        title: 'Guests',
        body: 'A guest list that does not lose history. Search, edit, link to bookings — and recognise repeats.',
        sample: <GuestsSample />,
    },
];

function CalendarSample() {
    return (
        <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 21 }).map((_, i) => {
                const filled = [1, 2, 3, 8, 9, 14, 15, 16, 17, 19].includes(i);
                return (
                    <div
                        key={i}
                        className={[
                            'h-3 rounded',
                            filled ? 'bg-neutral-900' : 'bg-neutral-100',
                        ].join(' ')}
                    />
                );
            })}
        </div>
    );
}

function RoomOpsSample() {
    return (
        <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 18 }).map((_, i) => {
                const status = i % 4 === 0 ? 'bg-neutral-900' : i % 5 === 0 ? 'bg-neutral-300' : 'bg-white border border-neutral-300';
                return <div key={i} className={['h-5 rounded', status].join(' ')} />;
            })}
        </div>
    );
}

function MaintenanceSample() {
    return (
        <div className="flex flex-col gap-1.5">
            {[
                { num: '203', text: 'AC unit · 2h ago' },
                { num: '108', text: 'Bathroom door · yesterday' },
                { num: '305', text: 'Lamp · 3d ago' },
            ].map((it) => (
                <div
                    key={it.num}
                    className="flex items-center gap-2 rounded border border-neutral-200 bg-white px-2 py-1 text-[10px]"
                >
                    <span className="font-semibold tabular-nums">{it.num}</span>
                    <span className="text-neutral-500">{it.text}</span>
                </div>
            ))}
        </div>
    );
}

function GuestsSample() {
    return (
        <div className="flex flex-col gap-1.5">
            {['Andersen, T.', 'Müller, K.', 'Pedersen, J.'].map((g) => (
                <div
                    key={g}
                    className="flex items-center gap-2 rounded border border-neutral-200 bg-white px-2 py-1 text-[10px]"
                >
                    <div className="size-4 rounded-full bg-neutral-900" />
                    <span className="font-medium">{g}</span>
                    <span className="ml-auto text-neutral-400">3 stays</span>
                </div>
            ))}
        </div>
    );
}

export default function Features() {
    const { ref, inView } = useInView<HTMLDivElement>();

    return (
        <section id="features" className="border-b border-neutral-200 bg-white">
            <div ref={ref} className="mx-auto max-w-6xl px-6 py-24 md:py-32">
                <div
                    className={[
                        'flex max-w-3xl flex-col gap-3 transition-all duration-700 ease-out',
                        inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                        Features
                    </span>
                    <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                        Everything a small hotel actually needs.
                    </h2>
                    <p className="mt-2 max-w-xl text-neutral-600">
                        No bloat, no enterprise checkboxes. Four modules that cover the day-to-day of running rooms.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 md:grid-cols-2">
                    {FEATURES.map((f, idx) => {
                        const Icon = f.icon;
                        return (
                            <article
                                key={f.title}
                                className={[
                                    'group flex flex-col gap-5 bg-white p-8 transition-all duration-700 ease-out hover:bg-neutral-50',
                                    inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                                ].join(' ')}
                                style={{ transitionDelay: inView ? `${idx * 100}ms` : '0ms' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-md bg-black text-white transition-transform group-hover:scale-105">
                                        <Icon className="size-4" />
                                    </div>
                                    <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                                </div>
                                <p className="text-sm leading-relaxed text-neutral-600">{f.body}</p>
                                <div className="mt-2 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                                    {f.sample}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
