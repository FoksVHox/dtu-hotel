import { Head } from '@inertiajs/react';
import {
    addDays,
    differenceInCalendarDays,
    endOfDay,
    format,
    isToday,
    isWithinInterval,
    parseISO,
    startOfDay,
} from 'date-fns';
import {
    CalendarCheck,
    CalendarRange,
    Clock,
    Filter,
    LogIn,
    LogOut,
    Plus,
    Search,
    TrendingUp,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { BookingFormDialog } from '@/components/booking/booking-form-dialog';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { BookingDetailDialog } from '@/components/calendar/booking-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import bookingsRoute from '@/routes/bookings';
import type { BreadcrumbItem } from '@/types';
import type { Booking } from '@/types/booking';
import {
    BOOKING_STATUSES,
    BookingStatus,
    type CalendarBooking,
    type CalendarFloor,
    type CalendarRoom,
    type CalendarRoomCategory,
} from '@/types/calendar';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Booking Management', href: bookingsRoute.index().url },
];

type SortKey = 'start' | 'end' | 'primaryGuest' | 'roomCount' | 'status';

interface BookingTableFilters {
    categoryIds: number[];
    floorIds: number[];
    statuses: BookingStatus[];
}

const DEFAULT_BOOKING_TABLE_FILTERS: BookingTableFilters = {
    categoryIds: [],
    floorIds: [],
    statuses: [],
};

function hasBookingFilters(filters: BookingTableFilters): boolean {
    return (
        filters.categoryIds.length > 0 ||
        filters.floorIds.length > 0 ||
        filters.statuses.length > 0
    );
}

function StatRow({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{label}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold">{value}</span>
        </div>
    );
}

function BookingFilterSheet({
    filters,
    onFiltersChange,
    categories,
    floors,
}: {
    filters: BookingTableFilters;
    onFiltersChange: (filters: BookingTableFilters) => void;
    categories: CalendarRoomCategory[];
    floors: CalendarFloor[];
}) {
    const activeCount =
        filters.categoryIds.length +
        filters.floorIds.length +
        filters.statuses.length;

    function toggleCategory(id: number): void {
        const next = filters.categoryIds.includes(id)
            ? filters.categoryIds.filter((categoryId) => categoryId !== id)
            : [...filters.categoryIds, id];

        onFiltersChange({ ...filters, categoryIds: next });
    }

    function toggleFloor(id: number): void {
        const next = filters.floorIds.includes(id)
            ? filters.floorIds.filter((floorId) => floorId !== id)
            : [...filters.floorIds, id];

        onFiltersChange({ ...filters, floorIds: next });
    }

    function toggleStatus(status: BookingStatus): void {
        const next = filters.statuses.includes(status)
            ? filters.statuses.filter(
                  (selectedStatus) => selectedStatus !== status,
              )
            : [...filters.statuses, status];

        onFiltersChange({ ...filters, statuses: next });
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="border-2">
                    <Filter className="size-4" />
                    Filters
                    {activeCount > 0 && (
                        <Badge className="ml-1 size-5 rounded-full p-0">
                            {activeCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="flex flex-col overflow-hidden"
            >
                <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                        Filter bookings by room category, floor, or booking
                        status.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid flex-1 grid-cols-2 gap-6 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Room Category
                            </span>
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox
                                        id={`booking-category-${category.id}`}
                                        checked={filters.categoryIds.includes(
                                            category.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleCategory(category.id)
                                        }
                                    />
                                    <Label
                                        htmlFor={`booking-category-${category.id}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {category.name}
                                    </Label>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Floor
                            </span>
                            {floors.map((floor) => (
                                <div
                                    key={floor.id}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox
                                        id={`booking-floor-${floor.id}`}
                                        checked={filters.floorIds.includes(
                                            floor.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleFloor(floor.id)
                                        }
                                    />
                                    <Label
                                        htmlFor={`booking-floor-${floor.id}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {floor.name} ({floor.code})
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Booking Status
                            </span>
                            {Object.entries(BOOKING_STATUSES).map(
                                ([value, config]) => {
                                    const status = Number(
                                        value,
                                    ) as BookingStatus;

                                    return (
                                        <div
                                            key={value}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`booking-status-${value}`}
                                                checked={filters.statuses.includes(
                                                    status,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleStatus(status)
                                                }
                                            />
                                            <Label
                                                htmlFor={`booking-status-${value}`}
                                                className="flex cursor-pointer items-center gap-1.5 text-sm font-normal"
                                            >
                                                <span
                                                    className="inline-block size-2.5 rounded-sm"
                                                    style={{
                                                        backgroundColor:
                                                            config.text,
                                                    }}
                                                />
                                                {config.label}
                                            </Label>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </div>

                {hasBookingFilters(filters) && (
                    <SheetFooter className="border-t">
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                                onFiltersChange(DEFAULT_BOOKING_TABLE_FILTERS)
                            }
                        >
                            Clear all filters
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}

function BookingFilterBar({
    filters,
    onFiltersChange,
    categories,
    floors,
}: {
    filters: BookingTableFilters;
    onFiltersChange: (filters: BookingTableFilters) => void;
    categories: CalendarRoomCategory[];
    floors: CalendarFloor[];
}) {
    if (!hasBookingFilters(filters)) {
        return null;
    }

    const categoryMap = new Map(
        categories.map((category) => [category.id, category.name]),
    );
    const floorMap = new Map(floors.map((floor) => [floor.id, floor.code]));

    function removeCategory(id: number): void {
        onFiltersChange({
            ...filters,
            categoryIds: filters.categoryIds.filter(
                (categoryId) => categoryId !== id,
            ),
        });
    }

    function removeFloor(id: number): void {
        onFiltersChange({
            ...filters,
            floorIds: filters.floorIds.filter((floorId) => floorId !== id),
        });
    }

    function removeStatus(status: BookingStatus): void {
        onFiltersChange({
            ...filters,
            statuses: filters.statuses.filter(
                (selectedStatus) => selectedStatus !== status,
            ),
        });
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {filters.categoryIds.map((id) => (
                <Badge key={`booking-category-${id}`} variant="secondary">
                    {categoryMap.get(id) ?? `Category ${id}`}
                    <button
                        type="button"
                        onClick={() => removeCategory(id)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${categoryMap.get(id)} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.floorIds.map((id) => (
                <Badge key={`booking-floor-${id}`} variant="secondary">
                    Floor {floorMap.get(id) ?? id}
                    <button
                        type="button"
                        onClick={() => removeFloor(id)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove floor ${floorMap.get(id)} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.statuses.map((status) => (
                <Badge key={`booking-status-${status}`} variant="secondary">
                    {BOOKING_STATUSES[status]?.label ?? `Status ${status}`}
                    <button
                        type="button"
                        onClick={() => removeStatus(status)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${BOOKING_STATUSES[status]?.label} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0.5 text-xs text-muted-foreground"
                onClick={() => onFiltersChange(DEFAULT_BOOKING_TABLE_FILTERS)}
            >
                Clear all
            </Button>
        </div>
    );
}

export default function BookingsIndex({
    bookings,
    rooms,
}: {
    bookings: Booking[];
    rooms: CalendarRoom[];
}) {
    const [sortKey, setSortKey] = useState<SortKey>('start');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(
        null,
    );
    const [detailOpen, setDetailOpen] = useState(false);
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [editBooking, setEditBooking] = useState<CalendarBooking | null>(
        null,
    );
    const [prefill, setPrefill] = useState<{
        roomId: number;
        date: Date;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<BookingTableFilters>(
        DEFAULT_BOOKING_TABLE_FILTERS,
    );

    const categories = useMemo(() => {
        const seen = new Map<number, CalendarRoomCategory>();

        for (const room of rooms) {
            if (!seen.has(room.room_category.id)) {
                seen.set(room.room_category.id, room.room_category);
            }
        }

        return [...seen.values()];
    }, [rooms]);

    const floors = useMemo(() => {
        const seen = new Map<number, CalendarFloor>();

        for (const room of rooms) {
            if (!seen.has(room.floor.id)) {
                seen.set(room.floor.id, room.floor);
            }
        }

        return [...seen.values()];
    }, [rooms]);

    const statistics = useMemo(() => {
        const today = new Date();
        const todayStart = startOfDay(today);
        const nextSevenDaysEnd = endOfDay(addDays(today, 7));

        const pending = bookings.filter(
            (booking) => booking.status === BookingStatus.Pending,
        ).length;
        const confirmed = bookings.filter(
            (booking) => booking.status === BookingStatus.Confirmed,
        ).length;
        const checkedIn = bookings.filter(
            (booking) => booking.status === BookingStatus.CheckedIn,
        ).length;
        const checkedOut = bookings.filter(
            (booking) => booking.status === BookingStatus.CheckedOut,
        ).length;
        const cancelled = bookings.filter(
            (booking) => booking.status === BookingStatus.Cancelled,
        ).length;
        const active = pending + confirmed + checkedIn;
        const totalRooms = bookings.reduce(
            (sum, booking) => sum + booking.rooms.length,
            0,
        );
        const totalNights = bookings.reduce((sum, booking) => {
            const nights = differenceInCalendarDays(
                parseISO(booking.end),
                parseISO(booking.start),
            );

            return sum + Math.max(nights, 1);
        }, 0);
        const checkInsToday = bookings.filter((booking) =>
            isToday(parseISO(booking.start)),
        ).length;
        const checkOutsToday = bookings.filter((booking) =>
            isToday(parseISO(booking.end)),
        ).length;
        const upcomingArrivals = bookings.filter((booking) => {
            if (
                booking.status === BookingStatus.Cancelled ||
                booking.status === BookingStatus.Maintenance
            ) {
                return false;
            }

            return isWithinInterval(parseISO(booking.start), {
                start: todayStart,
                end: nextSevenDaysEnd,
            });
        }).length;
        const inHouseGuests = bookings
            .filter((booking) => booking.status === BookingStatus.CheckedIn)
            .reduce((sum, booking) => sum + booking.guests.length, 0);
        const activePercent =
            bookings.length > 0
                ? Math.round((active / bookings.length) * 100)
                : 0;
        const cancellationPercent =
            bookings.length > 0
                ? Math.round((cancelled / bookings.length) * 100)
                : 0;
        const averageStay =
            bookings.length > 0 ? Math.round(totalNights / bookings.length) : 0;

        return {
            active,
            activePercent,
            averageStay,
            cancellationPercent,
            cancelled,
            checkedIn,
            checkedOut,
            checkInsToday,
            checkOutsToday,
            confirmed,
            inHouseGuests,
            pending,
            total: bookings.length,
            totalRooms,
            upcomingArrivals,
        };
    }, [bookings]);

    function toggleSort(key: SortKey): void {
        if (key === sortKey) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    const filteredBookings = useMemo(() => {
        const selectedCategoryIds = new Set(filters.categoryIds);
        const selectedFloorIds = new Set(filters.floorIds);
        const query = searchQuery.trim().toLowerCase();

        return bookings.filter((booking) => {
            if (
                filters.statuses.length > 0 &&
                !filters.statuses.includes(booking.status as BookingStatus)
            ) {
                return false;
            }

            if (
                selectedCategoryIds.size > 0 &&
                !booking.rooms.some((room) =>
                    selectedCategoryIds.has(room.room_category.id ?? -1),
                )
            ) {
                return false;
            }

            if (
                selectedFloorIds.size > 0 &&
                !booking.rooms.some((room) =>
                    selectedFloorIds.has(room.floor.id),
                )
            ) {
                return false;
            }

            if (query === '') {
                return true;
            }

            const statusLabel =
                BOOKING_STATUSES[booking.status as BookingStatus]?.label ?? '';
            const guestText = booking.guests
                .map(
                    (guest) =>
                        `${guest.first_name} ${guest.last_name} ${guest.email} ${guest.phone}`,
                )
                .join(' ');
            const roomText = booking.rooms
                .map((room) => `${room.room_category.name} ${room.floor.code}`)
                .join(' ');
            const searchableText = [
                format(parseISO(booking.start), 'd MMM yyyy'),
                format(parseISO(booking.end), 'd MMM yyyy'),
                statusLabel,
                guestText,
                roomText,
            ]
                .join(' ')
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [bookings, filters, searchQuery]);

    const sortedBookings = useMemo(() => {
        const copy = [...filteredBookings];
        copy.sort((a, b) => {
            let comparison = 0;

            if (sortKey === 'start') {
                comparison = a.start.localeCompare(b.start);
            } else if (sortKey === 'end') {
                comparison = a.end.localeCompare(b.end);
            } else if (sortKey === 'primaryGuest') {
                const nameA = a.guests[0]
                    ? `${a.guests[0].first_name} ${a.guests[0].last_name}`
                    : '';
                const nameB = b.guests[0]
                    ? `${b.guests[0].first_name} ${b.guests[0].last_name}`
                    : '';
                comparison = nameA.localeCompare(nameB);
            } else if (sortKey === 'roomCount') {
                comparison = a.rooms.length - b.rooms.length;
            } else if (sortKey === 'status') {
                comparison = a.status - b.status;
            }

            return sortDir === 'asc' ? comparison : -comparison;
        });
        return copy;
    }, [filteredBookings, sortKey, sortDir]);

    function handleBookingDialogOpenChange(isOpen: boolean): void {
        setBookingDialogOpen(isOpen);
        if (!isOpen) {
            setEditBooking(null);
            setPrefill(null);
        }
    }

    function openNewBookingDialog(): void {
        setEditBooking(null);
        setPrefill(null);
        setBookingDialogOpen(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarCheck className="size-4 text-muted-foreground" />
                                Booking Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <StatRow
                                icon={CalendarRange}
                                label="Total bookings"
                                value={statistics.total}
                            />
                            <StatRow
                                icon={TrendingUp}
                                label="Active bookings"
                                value={statistics.active}
                            />
                            <StatRow
                                icon={Clock}
                                label="Pending confirmations"
                                value={statistics.pending}
                            />
                            <StatRow
                                icon={XCircle}
                                label="Cancelled"
                                value={statistics.cancelled}
                            />
                            <Separator />
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        Active rate
                                    </span>
                                    <span className="text-xs font-medium">
                                        {statistics.activePercent}%
                                    </span>
                                </div>
                                <Progress value={statistics.activePercent} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="size-4 text-muted-foreground" />
                                Guest Flow
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <StatRow
                                icon={LogIn}
                                label="Check-ins today"
                                value={statistics.checkInsToday}
                            />
                            <StatRow
                                icon={LogOut}
                                label="Check-outs today"
                                value={statistics.checkOutsToday}
                            />
                            <StatRow
                                icon={Users}
                                label="In-house guests"
                                value={statistics.inHouseGuests}
                            />
                            <StatRow
                                icon={CalendarRange}
                                label="Upcoming arrivals"
                                value={statistics.upcomingArrivals}
                            />
                            <Separator />
                            <StatRow
                                icon={CalendarCheck}
                                label="Currently checked in"
                                value={statistics.checkedIn}
                            />
                        </CardContent>
                    </Card>

                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="size-4 text-muted-foreground" />
                                Schedule Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <StatRow
                                icon={CalendarCheck}
                                label="Confirmed"
                                value={statistics.confirmed}
                            />
                            <StatRow
                                icon={LogOut}
                                label="Checked out"
                                value={statistics.checkedOut}
                            />
                            <StatRow
                                icon={CalendarRange}
                                label="Room reservations"
                                value={statistics.totalRooms}
                            />
                            <StatRow
                                icon={Clock}
                                label="Average stay"
                                value={`${statistics.averageStay} nights`}
                            />
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Cancellation rate
                                </span>
                                <span className="text-xs font-medium">
                                    {statistics.cancellationPercent}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Search bookings..."
                            className="pr-8 pl-8"
                        />
                        {searchQuery !== '' && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute top-2.5 right-2.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Clear booking search"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <BookingFilterSheet
                            filters={filters}
                            onFiltersChange={setFilters}
                            categories={categories}
                            floors={floors}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={openNewBookingDialog}
                        >
                            <Plus className="size-4" />
                            New Booking
                        </Button>
                    </div>
                </div>

                <BookingFilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={categories}
                    floors={floors}
                />

                {filteredBookings.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                        {bookings.length === 0
                            ? 'No bookings found.'
                            : 'No bookings match your search or filters.'}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('start')}
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Check-in
                                            {sortKey === 'start' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('end')}
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Check-out
                                            {sortKey === 'end' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleSort('primaryGuest')
                                            }
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Guest
                                            {sortKey === 'primaryGuest' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleSort('roomCount')
                                            }
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Rooms
                                            {sortKey === 'roomCount' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('status')}
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Status
                                            {sortKey === 'status' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {sortedBookings.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="cursor-pointer hover:bg-white/5"
                                        onClick={() => {
                                            setSelectedBooking(b);
                                            setDetailOpen(true);
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            {format(
                                                parseISO(b.start),
                                                'd MMM yyyy',
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {format(
                                                parseISO(b.end),
                                                'd MMM yyyy',
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {b.guests[0]
                                                ? `${b.guests[0].first_name} ${b.guests[0].last_name}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {b.rooms.length}
                                        </td>
                                        <td className="px-4 py-3">
                                            <BookingStatusBadge
                                                status={b.status}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <BookingDetailDialog
                booking={selectedBooking}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />

            <BookingFormDialog
                open={bookingDialogOpen}
                onOpenChange={handleBookingDialogOpenChange}
                rooms={rooms}
                booking={editBooking}
                prefill={prefill}
            />
        </AppLayout>
    );
}
