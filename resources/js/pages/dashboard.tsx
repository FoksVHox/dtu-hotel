import { Head } from '@inertiajs/react';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { WeekHeader } from '@/components/calendar/week-header';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { router } from '@inertiajs/react';
import type { CalendarBooking, CalendarRoom } from '@/types/calendar';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// JS getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday.
// We want Monday as the week start, so we shift: if Sunday (0), go back 6 days; otherwise go back to day 1 (Monday).
function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Formats a Date as "YYYY-MM-DD" using LOCAL time components.
// We avoid toISOString() because it converts to UTC, which can shift the date backward in timezones east of UTC.
function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Props come from Laravel's DashboardController via Inertia.
// rooms: all hotel rooms with their category and floor.
// bookings: only bookings overlapping the current week (filtered server-side).
// weekStart: the Monday date string for the current week view (e.g. "2026-02-23").
export default function Dashboard({
    rooms,
    bookings,
    weekStart,
}: {
    rooms: CalendarRoom[];
    bookings: CalendarBooking[];
    weekStart: string;
}) {
    // Server is the source of truth for which week we're viewing — we parse its date string into a Date.
    const weekStartDate = getMonday(new Date(weekStart));

    // Shifts the calendar by +7 (next week) or -7 (previous week) days.
    // router.reload() re-requests the page from the server with the new ?week_start= query param.
    // replace: true swaps the current browser history entry so back/forward navigates between pages, not weeks.
    function shiftWeek(days: number) {
        const next = new Date(weekStartDate);
        next.setDate(next.getDate() + days);
        router.reload({ data: { week_start: formatLocalDate(next) }, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* 3 placeholder cards — will become stat widgets (occupancy, revenue, etc.) */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>

                {/* Week navigation bar: "< 23 Feb – 1 Mar 2026 >" */}
                <WeekHeader
                    weekStart={weekStartDate}
                    onPrev={() => shiftWeek(-7)}
                    onNext={() => shiftWeek(7)}
                />

                {/* Room/booking grid table: rooms as rows, days as columns, bookings as overlaid blocks */}
                <CalendarGrid
                    weekStart={weekStartDate}
                    rooms={rooms}
                    bookings={bookings}
                />
            </div>
        </AppLayout>
    );
}
