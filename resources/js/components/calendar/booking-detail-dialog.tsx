import { router } from '@inertiajs/react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import {
    CalendarDays,
    Clock,
    Mail,
    Moon,
    Pencil,
    Phone,
    Trash2,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { CalendarBooking } from '@/types/calendar';
import { getBookingStatusConfig } from '@/types/calendar';
import { destroy } from '@/actions/App/Http/Controllers/BookingController';

interface BookingDetailDialogProps {
    booking: CalendarBooking | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (booking: CalendarBooking) => void;
}

export function BookingDetailDialog({
    booking,
    open,
    onOpenChange,
    onEdit,
}: BookingDetailDialogProps) {
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!booking) {
        return null;
    }

    const config = getBookingStatusConfig(booking);
    const start = parseISO(booking.start);
    const end = parseISO(booking.end);
    const nights = differenceInCalendarDays(end, start);
    const primaryGuest = booking.guests[0] ?? null;

    const title = primaryGuest
        ? `${primaryGuest.first_name} ${primaryGuest.last_name}`
        : `Booking #${booking.id}`;

    function handleEdit() {
        onOpenChange(false);
        onEdit?.(booking!);
    }

    function handleDelete() {
        setIsDeleting(true);
        router.delete(destroy(booking!.id).url, {
            onSuccess: () => {
                setConfirmDeleteOpen(false);
                onOpenChange(false);
                toast.success('Booking deleted successfully.');
            },
            onError: (errors) => {
                setConfirmDeleteOpen(false);
                const message =
                    Object.values(errors)[0] ??
                    'Something went wrong while deleting the booking.';
                toast.error(message);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {title}
                            <span
                                className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                                style={{
                                    backgroundColor: config.bg,
                                    borderColor: config.border,
                                    color: config.text,
                                }}
                            >
                                {config.label}
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Booking #{booking.id}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CalendarDays className="size-3.5" />
                                    Check-in
                                </span>
                                <span className="text-sm font-medium">
                                    {format(start, 'd MMM yyyy')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(start, 'HH:mm')}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="size-3.5" />
                                    Check-out
                                </span>
                                <span className="text-sm font-medium">
                                    {format(end, 'd MMM yyyy')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(end, 'HH:mm')}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Moon className="size-3.5" />
                                    Duration
                                </span>
                                <span className="text-sm font-medium">
                                    {nights} {nights === 1 ? 'night' : 'nights'}
                                </span>
                            </div>
                        </div>

                        {booking.rooms.length > 0 && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {booking.rooms.length === 1
                                            ? 'Room'
                                            : 'Rooms'}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {booking.rooms.map((room) => (
                                            <span
                                                key={room.id}
                                                className="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
                                            >
                                                {room.room_category?.name}{' '}
                                                &ndash; {room.floor?.code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {booking.guests.length > 0 && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-3">
                                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {booking.guests.length === 1
                                            ? 'Guest'
                                            : 'Guests'}
                                    </span>
                                    {booking.guests.map((guest, index) => (
                                        <div key={guest.id}>
                                            {index > 0 && (
                                                <Separator className="mb-3" />
                                            )}
                                            <div className="flex flex-col gap-1.5">
                                                <span className="flex items-center gap-2 text-sm font-medium">
                                                    <User className="size-3.5 text-muted-foreground" />
                                                    {guest.first_name}{' '}
                                                    {guest.last_name}
                                                </span>
                                                {guest.email && (
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Mail className="size-3.5" />
                                                        {guest.email}
                                                    </span>
                                                )}
                                                {guest.phone && (
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="size-3.5" />
                                                        {guest.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmDeleteOpen(true)}
                        >
                            <Trash2 className="size-3.5" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete booking #{booking.id}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
