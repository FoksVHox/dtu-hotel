import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeekHeaderProps {
    weekStart: Date;
    onPrev: () => void;
    onNext: () => void;
}

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

export function WeekHeader({ weekStart, onPrev, onNext }: WeekHeaderProps) {
    return (
        <div className="flex items-center justify-center gap-4">
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
        </div>
    );
}
