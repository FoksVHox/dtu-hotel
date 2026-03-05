import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export function TrendIndicator({
    current,
    previous,
}: {
    current: number;
    previous: number;
}) {
    const diff = current - previous;

    if (diff > 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-500">
                <ArrowUp className="size-3" />
            </span>
        );
    }

    if (diff < 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-500">
                <ArrowDown className="size-3" />
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
            <Minus className="size-3" />
        </span>
    );
}
