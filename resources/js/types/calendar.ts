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
}

export function getBookingStatusConfig(booking: {
    status: number;
}): BookingStatusConfig {
    return (
        BOOKING_STATUSES[booking.status as BookingStatus] ?? BOOKING_STATUSES[1]
    );
}

export const BOOKING_STATUSES: Record<BookingStatus, BookingStatusConfig> = {
    [BookingStatus.Pending]: {
        label: 'Pending',
        bg: '#1e2a4a',
        border: '#3a5296',
        text: '#7aa0f0',
        secondary: '#5070c0',
    },
    [BookingStatus.Confirmed]: {
        label: 'Confirmed',
        bg: '#0f2a2a',
        border: '#1a6666',
        text: '#00d4d4',
        secondary: '#008888',
    },
    [BookingStatus.CheckedIn]: {
        label: 'Checked In',
        bg: '#0f2a1a',
        border: '#1a6b35',
        text: '#00e065',
        secondary: '#00994a',
    },
    [BookingStatus.CheckedOut]: {
        label: 'Checked Out',
        bg: '#1a1a1a',
        border: '#444444',
        text: '#888888',
        secondary: '#555555',
    },
    [BookingStatus.Cancelled]: {
        label: 'Cancelled',
        bg: '#2a0f1a',
        border: '#7a1a3a',
        text: '#ff4d88',
        secondary: '#cc1a55',
    },
    [BookingStatus.Maintenance]: {
        label: 'Maintenance',
        bg: '#2a1a00',
        border: '#8a5500',
        text: '#ffaa00',
        secondary: '#cc8800',
    },
};
