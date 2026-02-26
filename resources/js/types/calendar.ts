export interface CalendarGuest {
    id: number;
    first_name: string;
    last_name: string;
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
    room_category: CalendarRoomCategory;
    floor: CalendarFloor;
}

export interface CalendarBooking {
    id: number;
    start: string;
    end: string;
    status: number;
    guests: CalendarGuest[];
    rooms: { id: number }[];
}

export const BOOKING_STATUS_LABELS: Record<number, string> = {
    1: 'Confirmed',
    2: 'Checked In',
    3: 'Maintenance',
};
