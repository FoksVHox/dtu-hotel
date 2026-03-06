import { Head, router } from '@inertiajs/react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { useState } from 'react';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { CalendarLegend } from '@/components/calendar/calendar-legend';
import { WeekHeader } from '@/components/calendar/week-header';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CalendarBooking, CalendarRoom } from '@/types/calendar';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({
    rooms,
    bookings,
    weekStart,
}: {
    rooms: CalendarRoom[];
    bookings: CalendarBooking[];
    weekStart: string;
}) {
    const weekStartDate = startOfWeek(parseISO(weekStart), {
        weekStartsOn: 1,
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    function shiftWeek(offset: number) {
        const next = addDays(weekStartDate, offset);
        router.reload({
            data: { week_start: format(next, 'yyyy-MM-dd') },
            replace: true,
        });
    }

    function refreshCalendar() {
        router.reload({
            only: ['rooms', 'bookings'],
            onStart: () => setIsRefreshing(true),
            onFinish: () => setIsRefreshing(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
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

                <WeekHeader
                    weekStart={weekStartDate}
                    onPrev={() => shiftWeek(-7)}
                    onNext={() => shiftWeek(7)}
                    onRefresh={refreshCalendar}
                    isRefreshing={isRefreshing}
                />

                <CalendarGrid
                    weekStart={weekStartDate}
                    rooms={rooms}
                    bookings={bookings}
                />

                <CalendarLegend />
            </div>
        </AppLayout>
    );
}
