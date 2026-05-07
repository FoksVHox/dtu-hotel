import { Deferred, Head, router } from '@inertiajs/react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { BookingFormDialog } from '@/components/booking/booking-form-dialog';
import { CalendarFilterBar } from '@/components/calendar/calendar-filter-bar';
import { CalendarFilterSheet } from '@/components/calendar/calendar-filter-sheet';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { CalendarLegend } from '@/components/calendar/calendar-legend';
import { WeekHeader } from '@/components/calendar/week-header';
import { BookingPipelineCard } from '@/components/dashboard/booking-pipeline-card';
import { RoomStatusCard } from '@/components/dashboard/room-status-card';
import { StatCardSkeleton } from '@/components/dashboard/stat-card-skeleton';
import { TodayActivityCard } from '@/components/dashboard/today-activity-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type {
    CalendarBooking,
    CalendarFilters,
    CalendarRoom,
} from '@/types/calendar';
import { DEFAULT_CALENDAR_FILTERS, hasActiveFilters } from '@/types/calendar';
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
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [editBooking, setEditBooking] = useState<CalendarBooking | null>(
        null,
    );
    const [filters, setFilters] = useState<CalendarFilters>(
        DEFAULT_CALENDAR_FILTERS,
    );

    const categories = useMemo(() => {
        const seen = new Map<number, (typeof rooms)[number]['room_category']>();
        for (const room of rooms) {
            if (!seen.has(room.room_category.id)) {
                seen.set(room.room_category.id, room.room_category);
            }
        }
        return [...seen.values()];
    }, [rooms]);

    const floors = useMemo(() => {
        const seen = new Map<number, (typeof rooms)[number]['floor']>();
        for (const room of rooms) {
            if (!seen.has(room.floor.id)) {
                seen.set(room.floor.id, room.floor);
            }
        }
        return [...seen.values()];
    }, [rooms]);

    const { filteredRooms, filteredBookings } = useMemo(() => {
        let roomResult = rooms;

        if (filters.categoryIds.length > 0) {
            roomResult = roomResult.filter((r) =>
                filters.categoryIds.includes(r.room_category_id),
            );
        }

        if (filters.floorIds.length > 0) {
            roomResult = roomResult.filter((r) =>
                filters.floorIds.includes(r.floor_id),
            );
        }

        let bookingResult = bookings;

        if (filters.statuses.length > 0) {
            bookingResult = bookingResult.filter((b) =>
                filters.statuses.includes(b.status),
            );
        }

        if (filters.onlyWithBookings) {
            const roomIdsWithBookings = new Set(
                bookingResult.flatMap((b) => b.rooms.map((r) => r.id)),
            );
            roomResult = roomResult.filter((r) =>
                roomIdsWithBookings.has(r.id),
            );
        }

        return { filteredRooms: roomResult, filteredBookings: bookingResult };
    }, [rooms, bookings, filters]);

    const handleEditBooking = useCallback((booking: CalendarBooking) => {
        setEditBooking(booking);
        setBookingDialogOpen(true);
    }, []);

    function handleBookingDialogOpenChange(isOpen: boolean) {
        setBookingDialogOpen(isOpen);
        if (!isOpen) {
            setEditBooking(null);
        }
    }

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
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="mb-20 grid auto-rows-min gap-4 md:grid-cols-3">
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
                    onCreateBooking={() => {
                        setEditBooking(null);
                        setBookingDialogOpen(true);
                    }}
                    filterSlot={
                        <CalendarFilterSheet
                            filters={filters}
                            onFiltersChange={setFilters}
                            categories={categories}
                            floors={floors}
                        />
                    }
                />

                <CalendarFilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={categories}
                    floors={floors}
                />

                <CalendarGrid
                    weekStart={weekStartDate}
                    rooms={filteredRooms}
                    bookings={filteredBookings}
                    onEdit={handleEditBooking}
                    hasActiveFilters={hasActiveFilters(filters)}
                />

                <CalendarLegend />

                <BookingFormDialog
                    open={bookingDialogOpen}
                    onOpenChange={handleBookingDialogOpenChange}
                    rooms={rooms}
                    booking={editBooking}
                />
            </div>
        </AppLayout>
    );
}
