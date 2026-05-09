import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUSES } from '@/types/calendar';

export const STATUS_CONFIG = BOOKING_STATUSES;

const BOOKING_STATUS_CLASSES: Record<number, string> = {
    1: 'border-blue-500/40 text-blue-400',
    2: 'border-cyan-500/40 text-cyan-400',
    3: 'border-green-500/40 text-green-400',
    4: 'border-zinc-500/40 text-zinc-400',
    5: 'border-red-500/40 text-red-400',
    6: 'border-amber-500/40 text-amber-400',
};

export const ROOM_STATUS_CONFIG: Record<number, { label: string; className: string }> = {
    0: { label: 'Available',    className: 'border-green-500/40 text-green-400' },
    1: { label: 'Occupied',     className: 'border-blue-500/40 text-blue-400'   },
    2: { label: 'Cleaning',     className: 'border-amber-500/40 text-amber-400' },
    3: { label: 'Out of Order', className: 'border-red-500/40 text-red-400'     },
};

export function RoomStatusBadge({
    status,
    manualStatus,
    fallbackStatus,
}: {
    status: number | null | undefined;
    manualStatus?: number | null;
    fallbackStatus?: number;
}) {
    if (manualStatus != null) {
        const cfg = BOOKING_STATUSES[manualStatus as keyof typeof BOOKING_STATUSES];
        const className = BOOKING_STATUS_CLASSES[manualStatus];

        if (!cfg || !className) {
            return <Badge variant="outline" className="border-border text-muted-foreground">Unknown</Badge>;
        }

        return <Badge variant="outline" className={className}>{cfg.label}</Badge>;
    }

    if (status != null) {
        const cfg = BOOKING_STATUSES[status as keyof typeof BOOKING_STATUSES];
        const className = BOOKING_STATUS_CLASSES[status];

        if (!cfg || !className) {
            return <Badge variant="outline" className="border-border text-muted-foreground">Unknown</Badge>;
        }

        return <Badge variant="outline" className={className}>{cfg.label}</Badge>;
    }

    if (fallbackStatus != null) {
        const cfg = ROOM_STATUS_CONFIG[fallbackStatus];

        if (!cfg) {
            return <Badge variant="outline" className="border-border text-muted-foreground">Unknown</Badge>;
        }

        return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
    }

    return <Badge variant="outline" className="border-border text-muted-foreground">Unknown</Badge>;
}
