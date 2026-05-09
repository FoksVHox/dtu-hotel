import { useInView } from '@/hooks/use-in-view';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function Cta({ canRegister }: { canRegister: boolean }) {
    const { ref, inView } = useInView<HTMLDivElement>();

    return (
        <section className="relative overflow-hidden bg-black text-white">
            {/* dot grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
                aria-hidden
            />
            <div ref={ref} className="relative mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
                <div
                    className={[
                        'transition-all duration-700 ease-out',
                        inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                        <span className="size-1.5 rounded-full bg-white" />
                        Ready in 3 minutes
                    </span>
                </div>

                <h2
                    className={[
                        'mt-6 text-5xl font-semibold leading-[1.05] tracking-tight transition-all duration-700 ease-out md:text-6xl',
                        inView ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    Stop juggling tabs.
                    <br />
                    Start running your hotel.
                </h2>

                <p
                    className={[
                        'mx-auto mt-6 max-w-xl text-base text-white/70 transition-all duration-700 ease-out',
                        inView ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    Sign up, walk through three short steps, and your dashboard is live.
                </p>

                <div
                    className={[
                        'mt-10 flex flex-wrap items-center justify-center gap-5 transition-all duration-700 ease-out',
                        inView ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-4 opacity-0',
                    ].join(' ')}
                >
                    {canRegister && (
                        <Link
                            href="/register"
                            className="group inline-flex h-12 items-center gap-2 rounded-md bg-white px-7 text-sm font-medium text-black transition hover:bg-neutral-200"
                        >
                            Get started
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    )}
                    <Link
                        href="/login"
                        className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
                    >
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </section>
    );
}
