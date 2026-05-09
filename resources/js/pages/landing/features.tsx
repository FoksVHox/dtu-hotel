const FEATURES = [
    {
        title: 'Booking calendar',
        body: 'Visual week and month views. Drag to create, click to edit. Color-coded by status.',
    },
    {
        title: 'Room operations',
        body: 'Track every room, every floor. Housekeeping status updates without spreadsheets.',
    },
    {
        title: 'Maintenance log',
        body: 'Record what broke, who fixed it, and when. Tied to rooms automatically.',
    },
    {
        title: 'Guests',
        body: "A guest list that doesn't lose history. Search, edit, link to bookings.",
    },
];

export default function Features() {
    return (
        <section className="border-b border-neutral-200">
            <div className="mx-auto max-w-6xl px-6 py-24">
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
                    Everything a small hotel actually needs.
                </h2>
                <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded border border-neutral-200 bg-neutral-200 md:grid-cols-2">
                    {FEATURES.map((f) => (
                        <article key={f.title} className="bg-white p-8">
                            <h3 className="text-xl font-semibold">{f.title}</h3>
                            <p className="mt-3 text-sm text-neutral-600">{f.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
