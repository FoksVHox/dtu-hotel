import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { update, destroy } from '@/actions/App/Http/Controllers/BookingController';
import { BookingDetailDialog } from '@/components/calendar/booking-detail-dialog';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import bookingsRoute from '@/routes/bookings';
import type { Booking } from '@/types/booking';
import type { CalendarBooking } from '@/types/calendar';
import { BookingStatus } from '@/types/calendar';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Booking Management', href: bookingsRoute.index().url },
];

type SortKey = 'start' | 'end' | 'primaryGuest' | 'roomCount' | 'status';

const DELETABLE_STATUSES = new Set([
    BookingStatus.Pending,
    BookingStatus.Confirmed,
    BookingStatus.Cancelled,
]);

export default function BookingsIndex({ bookings }: { bookings: Booking[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('start');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const counts = useMemo(
        () => ({
            total: bookings.length,
            checkedIn: bookings.filter((b) => b.status === BookingStatus.CheckedIn).length,
            active: bookings.filter(
                (b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Confirmed,
            ).length,
            cancelled: bookings.filter((b) => b.status === BookingStatus.Cancelled).length,
        }),
        [bookings],
    );

    function toggleSort(key: SortKey): void {
        if (key === sortKey) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    const sortedBookings = useMemo(() => {
        const copy = [...bookings];
        copy.sort((a, b) => {
            let comparison = 0;

            if (sortKey === 'start') {
                comparison = a.start.localeCompare(b.start);
            } else if (sortKey === 'end') {
                comparison = a.end.localeCompare(b.end);
            } else if (sortKey === 'primaryGuest') {
                const nameA = a.guests[0] ? `${a.guests[0].first_name} ${a.guests[0].last_name}` : '';
                const nameB = b.guests[0] ? `${b.guests[0].first_name} ${b.guests[0].last_name}` : '';
                comparison = nameA.localeCompare(nameB);
            } else if (sortKey === 'roomCount') {
                comparison = a.rooms.length - b.rooms.length;
            } else if (sortKey === 'status') {
                comparison = a.status - b.status;
            }

            return sortDir === 'asc' ? comparison : -comparison;
        });
        return copy;
    }, [bookings, sortKey, sortDir]);

    function handleStatusChange(bookingId: number, status: string): void {
        router.patch(update(bookingId).url, { status: Number(status) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Total Bookings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{counts.total}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Checked In</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{counts.checkedIn}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{counts.active}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Cancelled</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{counts.cancelled}</p>
                        </CardContent>
                    </Card>
                </div>

                {bookings.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                        No bookings found.
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
                                                    {sortDir === 'asc' ? '↑' : '↓'}
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
                                                    {sortDir === 'asc' ? '↑' : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('primaryGuest')}
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Guest
                                            {sortKey === 'primaryGuest' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc' ? '↑' : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('roomCount')}
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Rooms
                                            {sortKey === 'roomCount' ? (
                                                <span className="text-muted-foreground">
                                                    {sortDir === 'asc' ? '↑' : '↓'}
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
                                                    {sortDir === 'asc' ? '↑' : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
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
                                            {format(parseISO(b.start), 'd MMM yyyy')}
                                        </td>
                                        <td className="px-4 py-3">
                                            {format(parseISO(b.end), 'd MMM yyyy')}
                                        </td>
                                        <td className="px-4 py-3">
                                            {b.guests[0]
                                                ? `${b.guests[0].first_name} ${b.guests[0].last_name}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">{b.rooms.length}</td>
                                        <td className="px-4 py-3">
                                            <BookingStatusBadge status={b.status} />
                                        </td>
                                        <td
                                            className="px-4 py-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={String(b.status)}
                                                    onValueChange={(value) =>
                                                        handleStatusChange(b.id, value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-36 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={String(BookingStatus.Pending)}>
                                                            Pending
                                                        </SelectItem>
                                                        <SelectItem value={String(BookingStatus.Confirmed)}>
                                                            Confirmed
                                                        </SelectItem>
                                                        <SelectItem value={String(BookingStatus.CheckedIn)}>
                                                            Checked In
                                                        </SelectItem>
                                                        <SelectItem value={String(BookingStatus.CheckedOut)}>
                                                            Checked Out
                                                        </SelectItem>
                                                        <SelectItem value={String(BookingStatus.Cancelled)}>
                                                            Cancelled
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <button
                                                    type="button"
                                                    className="rounded-md border border-white/10 p-2 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                                                    title="Delete"
                                                    disabled={!DELETABLE_STATUSES.has(b.status)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(b.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <BookingDetailDialog
                booking={selectedBooking as CalendarBooking | null}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />

            <Dialog
                open={confirmDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmDeleteId(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Booking</DialogTitle>
                        <DialogDescription>This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setConfirmDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-red-700 text-white hover:bg-red-800"
                            onClick={() => {
                                if (confirmDeleteId !== null) {
                                    router.delete(destroy(confirmDeleteId).url);
                                    setConfirmDeleteId(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
