import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeekHeaderProps {
    weekStart: Date;
    onPrev: () => void;
    onNext: () => void;
}

// Formats the week range with three branches depending on whether the week crosses month/year boundaries:
//   Same month:       "23–29 March 2026"
//   Cross-month:      "28 Feb – 6 Mar 2026"
//   Cross-year:       "29 Dec 2025 – 4 Jan 2026"
function formatWeekRange(weekStart: Date): string {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleString('en-GB', { month: 'long' });
    const endMonth = end.toLocaleString('en-GB', { month: 'long' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear) {
        const startMonthShort = start.toLocaleString('en-GB', {
            month: 'short',
        });
        const endMonthShort = end.toLocaleString('en-GB', { month: 'short' });
        return `${startDay} ${startMonthShort} ${startYear} – ${endDay} ${endMonthShort} ${endYear}`;
    }

    if (startMonth !== endMonth) {
        const startMonthShort = start.toLocaleString('en-GB', {
            month: 'short',
        });
        const endMonthShort = end.toLocaleString('en-GB', { month: 'short' });
        return `${startDay} ${startMonthShort} – ${endDay} ${endMonthShort} ${endYear}`;
    }

    return `${startDay}–${endDay} ${startMonth} ${startYear}`;
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
