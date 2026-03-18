import { Badge } from '@/components/ui/badge';
import {
    BOOKING_STATUSES,
    BookingStatus,
    type BookingStatus as BookingStatusValue,
} from '@/types/calendar';

const STATUS_CLASSNAMES: Record<BookingStatusValue, string> = {
    [BookingStatus.Unknown]: 'border-zinc-500/40 text-zinc-400',
    [BookingStatus.Pending]: 'border-blue-500/40 text-blue-400',
    [BookingStatus.Confirmed]: 'border-cyan-500/40 text-cyan-400',
    [BookingStatus.CheckedIn]: 'border-green-500/40 text-green-400',
    [BookingStatus.CheckedOut]: 'border-slate-500/40 text-slate-400',
    [BookingStatus.Cancelled]: 'border-rose-500/40 text-rose-400',
    [BookingStatus.Maintenance]: 'border-amber-500/40 text-amber-400',
};

export function RoomStatusBadge({ status }: { status: BookingStatusValue }) {
    const label =
        BOOKING_STATUSES[status]?.label ?? BOOKING_STATUSES[BookingStatus.Unknown].label;
    const className =
        STATUS_CLASSNAMES[status] ?? STATUS_CLASSNAMES[BookingStatus.Unknown];

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    );
}
