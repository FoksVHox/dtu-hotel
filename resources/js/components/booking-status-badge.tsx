import { Badge } from '@/components/ui/badge';

// Status values 0..6 — keep in sync with the BookingStatus enum used elsewhere in the app. ###DM
const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
    0: { label: 'Unknown', className: 'border-zinc-500/40 text-zinc-400' },
    1: { label: 'Pending', className: 'border-blue-500/40 text-blue-400' },
    2: { label: 'Confirmed', className: 'border-cyan-500/40 text-cyan-400' },
    3: { label: 'Checked In', className: 'border-green-500/40 text-green-400' },
    4: { label: 'Checked Out', className: 'border-zinc-500/40 text-zinc-400' },
    5: { label: 'Cancelled', className: 'border-red-500/40 text-red-400' },
    6: {
        label: 'Maintenance',
        className: 'border-amber-500/40 text-amber-400',
    },
};

export function BookingStatusBadge({ status }: { status: number }) {
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
