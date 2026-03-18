import { addDays, format, getMonth, getYear } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeekHeaderProps {
    weekStart: Date;
    onPrev: () => void;
    onNext: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    onCreateBooking?: () => void;
}

/**
 * Formats the week range with three branches:
 *   Same month:  "23–29 March 2026"
 *   Cross-month: "28 Feb – 6 Mar 2026"
 *   Cross-year:  "29 Dec 2025 – 4 Jan 2026"
 */
function formatWeekRange(weekStart: Date): string {
    const start = weekStart;
    const end = addDays(weekStart, 6);

    if (getYear(start) !== getYear(end)) {
        return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
    }

    if (getMonth(start) !== getMonth(end)) {
        return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
    }

    return `${format(start, 'd')}–${format(end, 'd MMMM yyyy')}`;
}

export function WeekHeader({
    weekStart,
    onPrev,
    onNext,
    onRefresh,
    isRefreshing = false,
    onCreateBooking,
}: WeekHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="w-[140px]" />

            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onPrev}
                    aria-label="Previous week"
                >
                    <ChevronLeft />
                </Button>

                <h2 className="text-lg font-semibold">
                    {formatWeekRange(weekStart)}
                </h2>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={onNext}
                    aria-label="Next week"
                >
                    <ChevronRight />
                </Button>

                {onRefresh && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        aria-label="Refresh calendar"
                    >
                        <RefreshCw
                            className={isRefreshing ? 'animate-spin' : ''}
                        />
                    </Button>
                )}
            </div>

            <div className="flex w-[140px] justify-end">
                {onCreateBooking && (
                    <Button onClick={onCreateBooking} size="sm">
                        <Plus className="size-4" />
                        New Booking
                    </Button>
                )}
            </div>
        </div>
    );
}
