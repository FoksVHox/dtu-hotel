import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
    CalendarFilters,
    CalendarFloor,
    CalendarRoomCategory,
} from '@/types/calendar';
import {
    BOOKING_STATUSES,
    DEFAULT_CALENDAR_FILTERS,
    hasActiveFilters,
} from '@/types/calendar';
import type { BookingStatus } from '@/types/calendar';

interface CalendarFilterBarProps {
    filters: CalendarFilters;
    onFiltersChange: (filters: CalendarFilters) => void;
    categories: CalendarRoomCategory[];
    floors: CalendarFloor[];
}

export function CalendarFilterBar({
    filters,
    onFiltersChange,
    categories,
    floors,
}: CalendarFilterBarProps) {
    if (!hasActiveFilters(filters)) {
        return null;
    }

    function removeCategory(id: number) {
        onFiltersChange({
            ...filters,
            categoryIds: filters.categoryIds.filter((c) => c !== id),
        });
    }

    function removeFloor(id: number) {
        onFiltersChange({
            ...filters,
            floorIds: filters.floorIds.filter((f) => f !== id),
        });
    }

    function removeStatus(status: BookingStatus) {
        onFiltersChange({
            ...filters,
            statuses: filters.statuses.filter((s) => s !== status),
        });
    }

    function removeOnlyWithBookings() {
        onFiltersChange({ ...filters, onlyWithBookings: false });
    }

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const floorMap = new Map(floors.map((f) => [f.id, f.code]));

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {filters.categoryIds.map((id) => (
                <Badge key={`cat-${id}`} variant="secondary">
                    {categoryMap.get(id) ?? `Category ${id}`}
                    <button
                        onClick={() => removeCategory(id)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${categoryMap.get(id)} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.floorIds.map((id) => (
                <Badge key={`floor-${id}`} variant="secondary">
                    Floor {floorMap.get(id) ?? id}
                    <button
                        onClick={() => removeFloor(id)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove floor ${floorMap.get(id)} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.statuses.map((status) => (
                <Badge key={`status-${status}`} variant="secondary">
                    {BOOKING_STATUSES[status]?.label ?? `Status ${status}`}
                    <button
                        onClick={() => removeStatus(status)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${BOOKING_STATUSES[status]?.label} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.onlyWithBookings && (
                <Badge variant="secondary">
                    Only with bookings
                    <button
                        onClick={removeOnlyWithBookings}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label="Remove only with bookings filter"
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            )}

            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0.5 text-xs text-muted-foreground"
                onClick={() => onFiltersChange(DEFAULT_CALENDAR_FILTERS)}
            >
                Clear all
            </Button>
        </div>
    );
}
