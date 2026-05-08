import { Badge } from '@/components/ui/badge';

// Status values: 0..3 — keep in sync with the RoomStatus enum used elsewhere in the app. ###DM
// Note: The status values should ideally be typed as RoomStatus, but since this component is used in multiple places with different data sources, we'll keep it as number for flexibility. ###DM
export const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
    0: { label: 'Available', className: 'border-green-500/40 text-green-400' },
    1: { label: 'Occupied', className: 'border-red-500/40 text-red-400' },
    2: { label: 'Cleaning', className: 'border-amber-500/40 text-amber-400' },
    3: { label: 'Out of Order', className: 'border-zinc-500/40 text-zinc-400' },
};

export function RoomStatusBadge({ status }: { status: number }) {
    const cfg = STATUS_CONFIG[status];

    if (!cfg) {
        return (
            <Badge
                variant="outline"
                className="border-border text-muted-foreground"
            >
                Unknown
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className={cfg.className}>
            {cfg.label}
        </Badge>
    );
}
