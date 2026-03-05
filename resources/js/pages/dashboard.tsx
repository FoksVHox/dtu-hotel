import { Deferred, Head, router } from '@inertiajs/react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { useState } from 'react';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { CalendarLegend } from '@/components/calendar/calendar-legend';
import { WeekHeader } from '@/components/calendar/week-header';
import { BookingPipelineCard } from '@/components/dashboard/booking-pipeline-card';
import { RoomStatusCard } from '@/components/dashboard/room-status-card';
import { StatCardSkeleton } from '@/components/dashboard/stat-card-skeleton';
import { TodayActivityCard } from '@/components/dashboard/today-activity-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CalendarBooking, CalendarRoom } from '@/types/calendar';
import type {
    BookingPipeline,
    RoomStatus,
    TodayActivity,
} from '@/types/dashboard';
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
    todayActivity,
    roomStatus,
    bookingPipeline,
}: {
    rooms: CalendarRoom[];
    bookings: CalendarBooking[];
    weekStart: string;
    todayActivity: TodayActivity;
    roomStatus: RoomStatus;
    bookingPipeline: BookingPipeline;
}) {
    const weekStartDate = startOfWeek(parseISO(weekStart), {
        weekStartsOn: 1,
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    function shiftWeek(offset: number) {
        const next = addDays(weekStartDate, offset);
        router.reload({
            data: { week_start: format(next, 'yyyy-MM-dd') },
            only: ['rooms', 'bookings', 'weekStart'],
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
                    <Deferred
                        data="todayActivity"
                        fallback={<StatCardSkeleton />}
                    >
                        <TodayActivityCard activity={todayActivity} />
                    </Deferred>
                    <Deferred data="roomStatus" fallback={<StatCardSkeleton />}>
                        <RoomStatusCard status={roomStatus} />
                    </Deferred>
                    <Deferred
                        data="bookingPipeline"
                        fallback={<StatCardSkeleton />}
                    >
                        <BookingPipelineCard pipeline={bookingPipeline} />
                    </Deferred>
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
