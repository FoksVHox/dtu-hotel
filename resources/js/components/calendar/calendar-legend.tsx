import { BOOKING_STATUSES, BookingStatus } from '@/types/calendar';

export function CalendarLegend() {
    return (
        <div className="flex flex-wrap items-center gap-4 px-1">
            {Object.entries(BOOKING_STATUSES)
                .filter(([value]) => Number(value) !== BookingStatus.Cancelled)
                .map(([, config]) => (
                    <div
                        key={config.label}
                        className="flex items-center gap-1.5"
                    >
                        <span
                            className="inline-block h-3 w-3 rounded-sm border"
                            style={{
                                backgroundColor: config.dot,
                            }}
                        />
                        <span className="text-xs" style={{ color: config.dot }}>
                            {config.label}
                        </span>
                    </div>
                ))}
        </div>
    );
}
