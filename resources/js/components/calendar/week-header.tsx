import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, format, getMonth, getYear } from 'date-fns';

interface WeekHeaderProps {
    weekStart: Date;
    onPrev: () => void;
    onNext: () => void;
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

// Renders a centered navigation bar:  [ < ]  "23 Feb – 1 Mar 2026"  [ > ]
export function WeekHeader({ weekStart, onPrev, onNext }: WeekHeaderProps) {
    return (
        <div className="flex items-center justify-center gap-4">
            {/* Previous week button */}
            <Button
                variant="outline"
                size="icon"
                onClick={onPrev}
                aria-label="Previous week"
            >
                <ChevronLeft />
            </Button>

            {/* Formatted date range heading */}
            <h2 className="text-lg font-semibold">
                {formatWeekRange(weekStart)}
            </h2>

            {/* Next week button */}
            <Button
                variant="outline"
                size="icon"
                onClick={onNext}
                aria-label="Next week"
            >
                <ChevronRight />
            </Button>
        </div>
    );
}
