const PHRASES = [
    'Bookings',
    '·',
    'Rooms',
    '·',
    'Guests',
    '·',
    'Housekeeping',
    '·',
    'Maintenance',
    '·',
    'Calendar',
    '·',
    'Built at DTU',
    '·',
];

export default function Marquee() {
    const items = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES];
    return (
        <section className="overflow-hidden border-b border-neutral-200 bg-black py-6 text-white">
            <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
                {items.map((p, i) => (
                    <span
                        key={i}
                        className="mx-6 text-2xl font-semibold tracking-tight md:text-3xl"
                    >
                        {p}
                    </span>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}
