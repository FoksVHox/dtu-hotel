import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import CalendarPreview from './calendar-preview';

export default function Hero({ canRegister }: { canRegister: boolean }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    return (
        <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
            {/* subtle dot grid background */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
                aria-hidden
            />

            <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-2">
                    <AppLogoIcon className="size-6 fill-current" />
                    <span className="text-sm font-semibold tracking-tight">DTU Hotel</span>
                </div>
                <div className="flex items-center gap-5">
                    <a href="#features" className="hidden text-sm text-neutral-600 hover:text-black sm:inline">
                        Features
                    </a>
                    <a href="#how" className="hidden text-sm text-neutral-600 hover:text-black sm:inline">
                        How it works
                    </a>
                    <Link href="/login" className="text-sm text-neutral-600 hover:text-black">
                        Sign in
                    </Link>
                    {canRegister && (
                        <Link
                            href="/register"
                            className="h-9 rounded-md bg-black px-4 text-sm font-medium leading-9 text-white transition hover:bg-neutral-800"
                        >
                            Get started
                        </Link>
                    )}
                </div>
            </nav>

            <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-5 md:py-28">
                <div className="md:col-span-3">
                    <div
                        className={[
                            'inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition-all duration-700 ease-out',
                            mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                        ].join(' ')}
                    >
                        <span className="size-1.5 animate-pulse rounded-full bg-black" />
                        Built at DTU · For small & medium hotels
                    </div>

                    <h1
                        className={[
                            'mt-6 text-5xl font-semibold leading-[1.02] tracking-tight transition-all duration-700 ease-out md:text-7xl',
                            mounted ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-4 opacity-0',
                        ].join(' ')}
                    >
                        Run your hotel,
                        <br />
                        not your <span className="italic font-serif">spreadsheet.</span>
                    </h1>

                    <p
                        className={[
                            'mt-6 max-w-xl text-lg text-neutral-600 transition-all duration-700 ease-out',
                            mounted ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-4 opacity-0',
                        ].join(' ')}
                    >
                        DTU Hotel brings your bookings, rooms, guests, and maintenance into one place — fast to set up, calm to use.
                    </p>

                    <div
                        className={[
                            'mt-10 flex flex-wrap items-center gap-5 transition-all duration-700 ease-out',
                            mounted ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-4 opacity-0',
                        ].join(' ')}
                    >
                        {canRegister && (
                            <Link
                                href="/register"
                                className="group inline-flex h-12 items-center gap-2 rounded-md bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
                            >
                                Get started
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        )}
                        <Link
                            href="/login"
                            className="text-sm font-medium underline-offset-4 hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>

                    <div
                        className={[
                            'mt-12 flex items-center gap-6 text-xs text-neutral-500 transition-all duration-700 ease-out',
                            mounted ? 'opacity-100 delay-500' : 'opacity-0',
                        ].join(' ')}
                    >
                        <Stat label="Setup time" value="< 3 min" />
                        <Divider />
                        <Stat label="Spreadsheets needed" value="0" />
                        <Divider />
                        <Stat label="Built at" value="DTU" />
                    </div>
                </div>
                <div
                    className={[
                        'md:col-span-2 transition-all duration-1000 ease-out',
                        mounted ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-6 opacity-0',
                    ].join(' ')}
                >
                    <CalendarPreview />
                </div>
            </div>

            <div className="relative flex justify-center pb-8">
                <a
                    href="#how"
                    className="group flex flex-col items-center gap-2 text-xs text-neutral-400 hover:text-black"
                    aria-label="Scroll to how it works"
                >
                    <span className="uppercase tracking-widest">Scroll</span>
                    <ArrowDown className="size-4 animate-bounce" />
                </a>
            </div>
        </section>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="font-semibold text-black">{value}</span>
            <span>{label}</span>
        </div>
    );
}

function Divider() {
    return <div className="h-8 w-px bg-neutral-200" aria-hidden />;
}
