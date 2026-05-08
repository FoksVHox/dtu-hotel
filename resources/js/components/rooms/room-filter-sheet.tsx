import { Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { STATUS_CONFIG } from '@/components/room-status-badge'

export type RoomFilters = {
    categories: string[]
    floors: number[]
    statuses: number[]
}

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
    categories: [],
    floors: [],
    statuses: [],
}

export function hasActiveRoomFilters(filters: RoomFilters): boolean {
    return (
        filters.categories.length > 0 ||
        filters.floors.length > 0 ||
        filters.statuses.length > 0
    )
}

interface RoomFilterSheetProps {
    filters: RoomFilters
    onFiltersChange: (filters: RoomFilters) => void
    categories: string[]
    floors: number[]
}

export function RoomFilterSheet({
    filters,
    onFiltersChange,
    categories,
    floors,
}: RoomFilterSheetProps) {
    const activeCount =
        filters.categories.length + filters.floors.length + filters.statuses.length

    function toggleCategory(cat: string) {
        const next = filters.categories.includes(cat)
            ? filters.categories.filter((c) => c !== cat)
            : [...filters.categories, cat]
        onFiltersChange({ ...filters, categories: next })
    }

    function toggleFloor(floor: number) {
        const next = filters.floors.includes(floor)
            ? filters.floors.filter((f) => f !== floor)
            : [...filters.floors, floor]
        onFiltersChange({ ...filters, floors: next })
    }

    function toggleStatus(status: number) {
        const next = filters.statuses.includes(status)
            ? filters.statuses.filter((s) => s !== status)
            : [...filters.statuses, status]
        onFiltersChange({ ...filters, statuses: next })
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
            <SheetContent side="right" className="flex flex-col overflow-hidden">
                <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                        Filter rooms by category, floor, or status.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid flex-1 grid-cols-2 gap-6 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Category
                            </span>
                            {categories.map((cat) => (
                                <div key={cat} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`cat-${cat}`}
                                        checked={filters.categories.includes(cat)}
                                        onCheckedChange={() => toggleCategory(cat)}
                                    />
                                    <Label
                                        htmlFor={`cat-${cat}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {cat}
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
                                <div key={floor} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`floor-${floor}`}
                                        checked={filters.floors.includes(floor)}
                                        onCheckedChange={() => toggleFloor(floor)}
                                    />
                                    <Label
                                        htmlFor={`floor-${floor}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        Floor {floor}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Room Status
                        </span>
                        {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                            <div key={value} className="flex items-center gap-2">
                                <Checkbox
                                    id={`status-${value}`}
                                    checked={filters.statuses.includes(Number(value))}
                                    onCheckedChange={() => toggleStatus(Number(value))}
                                />
                                <Label
                                    htmlFor={`status-${value}`}
                                    className="cursor-pointer text-sm font-normal"
                                >
                                    {cfg.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {activeCount > 0 && (
                    <SheetFooter className="border-t">
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => onFiltersChange(DEFAULT_ROOM_FILTERS)}
                        >
                            Clear all filters
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    )
}
