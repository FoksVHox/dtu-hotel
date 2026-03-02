import { BOOKING_STATUSES } from '@/types/calendar';

export function CalendarLegend() {
    return (
        <div className="flex flex-wrap items-center gap-4 px-1">
            {Object.values(BOOKING_STATUSES).map((config) => (
                <div key={config.label} className="flex items-center gap-1.5">
                    <span
                        className="inline-block h-3 w-3 rounded-sm border"
                        style={{
                            backgroundColor: config.text,
                        }}
                    />
                    <span
                        className="text-xs"
                        style={{ color: config.text }}
                    >
                        {config.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
