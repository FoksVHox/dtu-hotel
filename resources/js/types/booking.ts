export interface NewGuest {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export interface SearchGuest {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export interface CreateBookingForm {
    room_ids: number[];
    guest_ids: number[];
    new_guests: NewGuest[];
    start: string;
    end: string;
    status: number;
}

export interface BookingGuest {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export interface BookingRoom {
    id: number;
    code: string;
    room_category: { name: string };
    floor: { code: string };
}

export interface Booking {
    id: number;
    start: string; // ISO 8601
    end: string; // ISO 8601
    status: number; // BookingStatus value
    guests: BookingGuest[];
    rooms: BookingRoom[];
}
