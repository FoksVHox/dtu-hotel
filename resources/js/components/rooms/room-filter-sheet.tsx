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
import { ROOM_STATUS_CONFIG } from '@/components/room-status-badge'

export type RoomFilters = {
    categories: string[]
    floors: string[]
    buildings: string[]
    statuses: number[]
}

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
    categories: [],
    floors: [],
    buildings: [],
    statuses: [],
}

export function hasActiveRoomFilters(filters: RoomFilters): boolean {
    return (
        filters.categories.length > 0 ||
        filters.floors.length > 0 ||
        filters.buildings.length > 0 ||
        filters.statuses.length > 0
    )
}

interface RoomFilterSheetProps {
    filters: RoomFilters
    onFiltersChange: (filters: RoomFilters) => void
    categories: string[]
    floors: string[]
    buildings: string[]
}

export function RoomFilterSheet({
    filters,
    onFiltersChange,
    categories,
    floors,
    buildings,
}: RoomFilterSheetProps) {
    const activeCount =
        filters.categories.length + filters.floors.length + filters.buildings.length + filters.statuses.length

    function toggle<T>(key: keyof RoomFilters, value: T) {
        const current = filters[key] as T[]
        const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value]
        onFiltersChange({ ...filters, [key]: next })
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
                        Filter rooms by building, floor, category, or status.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Building</span>
                        {buildings.map((b) => (
                            <div key={b} className="flex items-center gap-2">
                                <Checkbox
                                    id={`building-${b}`}
                                    checked={filters.buildings.includes(b)}
                                    onCheckedChange={() => toggle('buildings', b)}
                                />
                                <Label htmlFor={`building-${b}`} className="cursor-pointer text-sm font-normal">
                                    {b}
                                </Label>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Floor</span>
                        {floors.map((f) => (
                            <div key={f} className="flex items-center gap-2">
                                <Checkbox
                                    id={`floor-${f}`}
                                    checked={filters.floors.includes(f)}
                                    onCheckedChange={() => toggle('floors', f)}
                                />
                                <Label htmlFor={`floor-${f}`} className="cursor-pointer text-sm font-normal">
                                    {f}
                                </Label>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Category</span>
                        {categories.map((cat) => (
                            <div key={cat} className="flex items-center gap-2">
                                <Checkbox
                                    id={`cat-${cat}`}
                                    checked={filters.categories.includes(cat)}
                                    onCheckedChange={() => toggle('categories', cat)}
                                />
                                <Label htmlFor={`cat-${cat}`} className="cursor-pointer text-sm font-normal">
                                    {cat}
                                </Label>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Room Status</span>
                        {Object.entries(ROOM_STATUS_CONFIG).map(([value, cfg]) => (
                            <div key={value} className="flex items-center gap-2">
                                <Checkbox
                                    id={`status-${value}`}
                                    checked={filters.statuses.includes(Number(value))}
                                    onCheckedChange={() => toggle('statuses', Number(value))}
                                />
                                <Label htmlFor={`status-${value}`} className="cursor-pointer text-sm font-normal">
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
