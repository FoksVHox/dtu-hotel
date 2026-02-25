import type { CalendarBooking, CalendarRoom } from '@/types/calendar';

export const mockRooms: CalendarRoom[] = [
    {
        id: 1,
        hotel_id: 1,
        building_id: 1,
        floor_id: 1,
        room_category_id: 1,
        room_category: {
            id: 1,
            name: 'Deluxe',
            description: 'Deluxe room with sea view',
        },
        floor: { id: 1, name: 'First Floor', code: 'F1' },
    },
    {
        id: 2,
        hotel_id: 1,
        building_id: 1,
        floor_id: 1,
        room_category_id: 2,
        room_category: {
            id: 2,
            name: 'Standard',
            description: 'Standard double room',
        },
        floor: { id: 1, name: 'First Floor', code: 'F1' },
    },
    {
        id: 3,
        hotel_id: 1,
        building_id: 1,
        floor_id: 2,
        room_category_id: 1,
        room_category: {
            id: 1,
            name: 'Deluxe',
            description: 'Deluxe room with sea view',
        },
        floor: { id: 2, name: 'Second Floor', code: 'F2' },
    },
    {
        id: 4,
        hotel_id: 1,
        building_id: 1,
        floor_id: 2,
        room_category_id: 3,
        room_category: { id: 3, name: 'Suite', description: 'Luxury suite' },
        floor: { id: 2, name: 'Second Floor', code: 'F2' },
    },
    {
        id: 5,
        hotel_id: 1,
        building_id: 1,
        floor_id: 3,
        room_category_id: 2,
        room_category: {
            id: 2,
            name: 'Standard',
            description: 'Standard double room',
        },
        floor: { id: 3, name: 'Third Floor', code: 'F3' },
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

function offsetDate(base: Date, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const monday = getMonday(new Date());

export const mockBookings: CalendarBooking[] = [
    {
        id: 1,
        start: offsetDate(monday, 0),
        end: offsetDate(monday, 2),
        status: 1,
        guests: [{ id: 1, first_name: 'Anna', last_name: 'Jensen' }],
        rooms: [{ id: 1 }],
    },
    {
        id: 2,
        start: offsetDate(monday, 1),
        end: offsetDate(monday, 5),
        status: 2,
        guests: [{ id: 2, first_name: 'Lars', last_name: 'Nielsen' }],
        rooms: [{ id: 2 }],
    },
    {
        id: 3,
        start: offsetDate(monday, -2),
        end: offsetDate(monday, 1),
        status: 2,
        guests: [{ id: 3, first_name: 'Mette', last_name: 'Andersen' }],
        rooms: [{ id: 3 }],
    },
    {
        id: 4,
        start: offsetDate(monday, 4),
        end: offsetDate(monday, 8),
        status: 1,
        guests: [{ id: 4, first_name: 'Erik', last_name: 'Pedersen' }],
        rooms: [{ id: 3 }],
    },
    {
        id: 5,
        start: offsetDate(monday, 0),
        end: offsetDate(monday, 6),
        status: 3,
        guests: [],
        rooms: [{ id: 4 }],
    },
    {
        id: 6,
        start: offsetDate(monday, 3),
        end: offsetDate(monday, 4),
        status: 1,
        guests: [{ id: 5, first_name: 'Sofia', last_name: 'Holm' }],
        rooms: [{ id: 5 }],
    },
    {
        id: 7,
        start: offsetDate(monday, 5),
        end: offsetDate(monday, 6),
        status: 2,
        guests: [{ id: 6, first_name: 'Henrik', last_name: 'Lund' }],
        rooms: [{ id: 1 }],
    },
];
