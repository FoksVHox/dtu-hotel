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
