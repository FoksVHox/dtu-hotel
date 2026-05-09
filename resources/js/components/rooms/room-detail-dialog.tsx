import { format, parseISO } from 'date-fns';
import { Building2, CalendarDays, Layers, Pencil, Tag } from 'lucide-react';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { RoomStatusBadge } from '@/components/room-status-badge';
import type { Room } from '@/components/rooms-table';
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

interface RoomDetailDialogProps {
    room: Room | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (room: Room) => void;
}

export function RoomDetailDialog({ room, open, onOpenChange, onEdit }: RoomDetailDialogProps) {
    if (!room) return null;

    function handleEdit() {
        onOpenChange(false);
        onEdit?.(room!);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        Room {room.code ?? '—'}
                        <RoomStatusBadge status={null} fallbackStatus={room.status} />
                    </DialogTitle>
                    <DialogDescription>
                        {room.floor.building.name} &middot; {room.floor.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Building2 className="size-3.5" />
                                Building
                            </span>
                            <span className="text-sm font-medium">{room.floor.building.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Layers className="size-3.5" />
                                Floor
                            </span>
                            <span className="text-sm font-medium">{room.floor.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Tag className="size-3.5" />
                                Category
                            </span>
                            <span className="text-sm font-medium">{room.room_category.name}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {room.bookings.length === 0 ? 'No bookings' : 'Recent Bookings'}
                        </span>

                        {room.bookings.length === 0 && (
                            <p className="text-sm text-muted-foreground">This room has no bookings yet.</p>
                        )}

                        {room.bookings.map((booking) => {
                            const primaryGuest = booking.guests[0];
                            const guestName = primaryGuest
                                ? `${primaryGuest.first_name} ${primaryGuest.last_name}`
                                : `Booking #${booking.id}`;

                            return (
                                <div
                                    key={booking.id}
                                    className="flex flex-col gap-1.5 rounded-md border bg-muted/30 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{guestName}</span>
                                        <BookingStatusBadge status={booking.status} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <CalendarDays className="size-3" />
                                        {format(parseISO(booking.start), 'd MMM yyyy')}
                                        {' → '}
                                        {format(parseISO(booking.end), 'd MMM yyyy')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Pencil className="size-3.5" />
                        Edit Room
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
