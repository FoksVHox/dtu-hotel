import { Badge } from '@/components/ui/badge';
import { getBookingStatusConfig } from '@/types/calendar';

export function BookingStatusBadge({ status }: { status: number }) {
    if (status === 0) {
        return (
            <Badge
                variant="outline"
                className="border-zinc-500/40 bg-zinc-900/80 text-zinc-400"
            >
                Unknown
            </Badge>
        );
    }

    const config = getBookingStatusConfig({ status });

    return (
        <Badge
            variant="outline"
            style={{
                backgroundColor: config.bg,
                borderColor: config.border,
                color: config.text,
            }}
        >
            {config.label}
        </Badge>
    );
}
