import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type {
    CalendarFilters,
    CalendarFloor,
    CalendarRoomCategory,

    BookingStatus} from '@/types/calendar';
import {
    BOOKING_STATUSES,
    DEFAULT_CALENDAR_FILTERS,
    hasActiveFilters,
} from '@/types/calendar';

interface CalendarFilterSheetProps {
    filters: CalendarFilters;
    onFiltersChange: (filters: CalendarFilters) => void;
    categories: CalendarRoomCategory[];
    floors: CalendarFloor[];
}

export function CalendarFilterSheet({
    filters,
    onFiltersChange,
    categories,
    floors,
}: CalendarFilterSheetProps) {
    const activeCount =
        filters.categoryIds.length +
        filters.floorIds.length +
        filters.statuses.length +
        (filters.onlyWithBookings ? 1 : 0);

    function toggleCategory(id: number) {
        const next = filters.categoryIds.includes(id)
            ? filters.categoryIds.filter((c) => c !== id)
            : [...filters.categoryIds, id];
        onFiltersChange({ ...filters, categoryIds: next });
    }

    function toggleFloor(id: number) {
        const next = filters.floorIds.includes(id)
            ? filters.floorIds.filter((f) => f !== id)
            : [...filters.floorIds, id];
        onFiltersChange({ ...filters, floorIds: next });
    }

    function toggleStatus(status: BookingStatus) {
        const next = filters.statuses.includes(status)
            ? filters.statuses.filter((s) => s !== status)
            : [...filters.statuses, status];
        onFiltersChange({ ...filters, statuses: next });
    }

    function toggleOnlyWithBookings() {
        onFiltersChange({
            ...filters,
            onlyWithBookings: !filters.onlyWithBookings,
        });
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="border-2">
                    <Filter className="size-4" />
                    Filters
                    {activeCount > 0 && (
                        <Badge className="ml-1 size-5 rounded-full p-0">
                            {activeCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="flex flex-col overflow-hidden"
            >
                <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                        Filter the calendar grid by room category, floor, or
                        booking status.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid flex-1 grid-cols-2 gap-6 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Room Category
                            </span>
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox
                                        id={`cat-${cat.id}`}
                                        checked={filters.categoryIds.includes(
                                            cat.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleCategory(cat.id)
                                        }
                                    />
                                    <Label
                                        htmlFor={`cat-${cat.id}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {cat.name}
                                    </Label>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Floor
                            </span>
                            {floors.map((floor) => (
                                <div
                                    key={floor.id}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox
                                        id={`floor-${floor.id}`}
                                        checked={filters.floorIds.includes(
                                            floor.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleFloor(floor.id)
                                        }
                                    />
                                    <Label
                                        htmlFor={`floor-${floor.id}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {floor.name} ({floor.code})
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Booking Status
                            </span>
                            {Object.entries(BOOKING_STATUSES).map(
                                ([value, config]) => {
                                    const status = Number(
                                        value,
                                    ) as BookingStatus;
                                    return (
                                        <div
                                            key={value}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`status-${value}`}
                                                checked={filters.statuses.includes(
                                                    status,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleStatus(status)
                                                }
                                            />
                                            <Label
                                                htmlFor={`status-${value}`}
                                                className="flex cursor-pointer items-center gap-1.5 text-sm font-normal"
                                            >
                                                <span
                                                    className="inline-block size-2.5 rounded-sm"
                                                    style={{
                                                        backgroundColor:
                                                            config.text,
                                                    }}
                                                />
                                                {config.label}
                                            </Label>
                                        </div>
                                    );
                                },
                            )}
                        </div>

                        <Separator />

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="only-with-bookings"
                                checked={filters.onlyWithBookings}
                                onCheckedChange={toggleOnlyWithBookings}
                            />
                            <Label
                                htmlFor="only-with-bookings"
                                className="cursor-pointer text-sm font-normal"
                            >
                                Only rooms with bookings
                            </Label>
                        </div>
                    </div>
                </div>

                {hasActiveFilters(filters) && (
                    <SheetFooter className="border-t">
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                                onFiltersChange(DEFAULT_CALENDAR_FILTERS)
                            }
                        >
                            Clear all filters
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
