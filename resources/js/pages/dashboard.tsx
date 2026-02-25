import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { WeekHeader } from '@/components/calendar/week-header';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { mockBookings, mockRooms } from '@/data/mock-calendar';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export default function Dashboard() {
    const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

    function shiftWeek(days: number) {
        setWeekStart((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + days);
            return next;
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
                    weekStart={weekStart}
                    onPrev={() => shiftWeek(-7)}
                    onNext={() => shiftWeek(7)}
                />

                <CalendarGrid weekStart={weekStart} rooms={mockRooms} bookings={mockBookings} />
            </div>
        </AppLayout>
    );
}
