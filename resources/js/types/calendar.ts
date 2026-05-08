export interface CalendarGuest {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
}

export interface CalendarRoomCategory {
    id: number;
    name: string;
    description: string;
}

export interface CalendarFloor {
    id: number;
    name: string;
    code: string;
}

export interface CalendarRoom {
    id: number;
    hotel_id: number;
    building_id: number;
    floor_id: number;
    room_category_id: number;
    status: number; // RoomStatus enum value
    room_category: CalendarRoomCategory;
    floor: CalendarFloor;
}

export interface CalendarBookingRoom {
    id: number;
    room_category: CalendarRoomCategory;
    floor: CalendarFloor;
}

export interface CalendarBooking {
    id: number;
    start: string;
    end: string;
    status: BookingStatus;
    guests: CalendarGuest[];
    rooms: CalendarBookingRoom[];
}

export const BookingStatus = {
    Pending: 1,
    Confirmed: 2,
    CheckedIn: 3,
    CheckedOut: 4,
    Cancelled: 5,
    Maintenance: 6,
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export interface BookingStatusConfig {
    label: string;
    bg: string;
    border: string;
    text: string;
    secondary: string;
    dot: string;
}

export function getBookingStatusConfig(booking: {
    status: number;
}): BookingStatusConfig {
    return (
        BOOKING_STATUSES[booking.status as BookingStatus] ?? BOOKING_STATUSES[1]
    );
}

export interface CalendarFilters {
    categoryIds: number[];
    floorIds: number[];
    statuses: BookingStatus[];
    onlyWithBookings: boolean;
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
    categoryIds: [],
    floorIds: [],
    statuses: [],
    onlyWithBookings: false,
};

export function hasActiveFilters(filters: CalendarFilters): boolean {
    return (
        filters.categoryIds.length > 0 ||
        filters.floorIds.length > 0 ||
        filters.statuses.length > 0 ||
        filters.onlyWithBookings
    );
}

export const BOOKING_STATUSES: Record<BookingStatus, BookingStatusConfig> = {
    [BookingStatus.Pending]: {
        label: 'Pending',
        bg: 'var(--booking-pending-bg)',
        border: 'var(--booking-pending-border)',
        text: 'var(--booking-pending-text)',
        secondary: 'var(--booking-pending-secondary)',
        dot: 'var(--booking-pending-dot)',
    },
    [BookingStatus.Confirmed]: {
        label: 'Confirmed',
        bg: 'var(--booking-confirmed-bg)',
        border: 'var(--booking-confirmed-border)',
        text: 'var(--booking-confirmed-text)',
        secondary: 'var(--booking-confirmed-secondary)',
        dot: 'var(--booking-confirmed-dot)',
    },
    [BookingStatus.CheckedIn]: {
        label: 'Checked In',
        bg: 'var(--booking-checked-in-bg)',
        border: 'var(--booking-checked-in-border)',
        text: 'var(--booking-checked-in-text)',
        secondary: 'var(--booking-checked-in-secondary)',
        dot: 'var(--booking-checked-in-dot)',
    },
    [BookingStatus.CheckedOut]: {
        label: 'Checked Out',
        bg: 'var(--booking-checked-out-bg)',
        border: 'var(--booking-checked-out-border)',
        text: 'var(--booking-checked-out-text)',
        secondary: 'var(--booking-checked-out-secondary)',
        dot: 'var(--booking-checked-out-dot)',
    },
    [BookingStatus.Cancelled]: {
        label: 'Cancelled',
        bg: 'var(--booking-cancelled-bg)',
        border: 'var(--booking-cancelled-border)',
        text: 'var(--booking-cancelled-text)',
        secondary: 'var(--booking-cancelled-secondary)',
        dot: 'var(--booking-cancelled-dot)',
    },
    [BookingStatus.Maintenance]: {
        label: 'Maintenance',
        bg: 'var(--booking-maintenance-bg)',
        border: 'var(--booking-maintenance-border)',
        text: 'var(--booking-maintenance-text)',
        secondary: 'var(--booking-maintenance-secondary)',
        dot: 'var(--booking-maintenance-dot)',
    },
};
