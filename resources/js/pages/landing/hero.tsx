import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import CalendarPreview from './calendar-preview';

export default function Hero({ canRegister }: { canRegister: boolean }) {
    return (
        <section className="border-b border-neutral-200">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-2">
                    <AppLogoIcon className="size-6 fill-current" />
                    <span className="text-sm font-semibold">DTU Hotel</span>
                </div>
                <div className="flex items-center gap-5">
                    <Link href="/login" className="text-sm text-neutral-600 hover:text-black">
                        Sign in
                    </Link>
                    {canRegister && (
                        <Link
                            href="/register"
                            className="h-9 rounded bg-black px-4 text-sm font-medium leading-9 text-white hover:bg-neutral-800"
                        >
                            Get started
                        </Link>
                    )}
                </div>
            </nav>

            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-5">
                <div className="md:col-span-3">
                    <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                        Run your hotel,
                        <br />
                        not your spreadsheet.
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-neutral-600">
                        DTU Hotel is the SaaS for small and medium hotels — bookings, rooms, guests, and maintenance, all in one place.
                    </p>
                    <div className="mt-8 flex items-center gap-5">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="h-11 rounded bg-black px-6 text-sm font-medium leading-[44px] text-white hover:bg-neutral-800"
                            >
                                Get started
                            </Link>
                        )}
                        <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <CalendarPreview />
                </div>
            </div>
        </section>
    );
}
