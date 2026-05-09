import { useInView } from '@/hooks/use-in-view';

const STEPS = [
    {
        n: '01',
        title: 'Sign up in seconds',
        body: 'No credit card. No demo call. Drop in your hotel name and get a workspace.',
    },
    {
        n: '02',
        title: 'Map your hotel',
        body: 'Buildings, floors, rooms — defined once in a 3-step wizard. We even number the floors.',
    },
    {
        n: '03',
        title: 'Run the calendar',
        body: 'Drag to create bookings. Track check-ins, housekeeping, and maintenance from day one.',
    },
];

export default function HowItWorks() {
    const { ref, inView } = useInView<HTMLDivElement>();

    return (
        <section id="how" className="border-b border-neutral-200 bg-white">
            <div ref={ref} className="mx-auto max-w-6xl px-6 py-24 md:py-32">
                <div
                    className={[
                        'flex flex-col gap-3 transition-all duration-700 ease-out',
                        inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                        How it works
                    </span>
                    <h2 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                        From signup to running your hotel in three steps.
                    </h2>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                    {STEPS.map((step, idx) => (
                        <article
                            key={step.n}
                            className={[
                                'flex flex-col gap-4 transition-all duration-700 ease-out',
                                inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                            ].join(' ')}
                            style={{ transitionDelay: inView ? `${150 + idx * 120}ms` : '0ms' }}
                        >
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-semibold tracking-tight">{step.n}</span>
                                <span className="h-px flex-1 bg-neutral-200" />
                            </div>
                            <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                            <p className="text-sm leading-relaxed text-neutral-600">{step.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
