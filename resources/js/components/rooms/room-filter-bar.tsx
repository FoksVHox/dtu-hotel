import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROOM_STATUS_CONFIG } from '@/components/room-status-badge'
import {
    DEFAULT_ROOM_FILTERS,
    hasActiveRoomFilters,
    type RoomFilters,
} from '@/components/rooms/room-filter-sheet'

interface RoomFilterBarProps {
    filters: RoomFilters
    onFiltersChange: (filters: RoomFilters) => void
}

export function RoomFilterBar({ filters, onFiltersChange }: RoomFilterBarProps) {
    if (!hasActiveRoomFilters(filters)) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {filters.buildings.map((b) => (
                <Badge key={`building-${b}`} variant="secondary">
                    {b}
                    <button
                        onClick={() =>
                            onFiltersChange({
                                ...filters,
                                buildings: filters.buildings.filter((v) => v !== b),
                            })
                        }
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${b} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.floors.map((f) => (
                <Badge key={`floor-${f}`} variant="secondary">
                    {f}
                    <button
                        onClick={() =>
                            onFiltersChange({
                                ...filters,
                                floors: filters.floors.filter((v) => v !== f),
                            })
                        }
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${f} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.categories.map((cat) => (
                <Badge key={`cat-${cat}`} variant="secondary">
                    {cat}
                    <button
                        onClick={() =>
                            onFiltersChange({
                                ...filters,
                                categories: filters.categories.filter((c) => c !== cat),
                            })
                        }
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${cat} filter`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {filters.statuses.map((status) => (
                <Badge key={`status-${status}`} variant="secondary">
                    {ROOM_STATUS_CONFIG[status]?.label ?? `Status ${status}`}
                    <button
                        onClick={() =>
                            onFiltersChange({
                                ...filters,
                                statuses: filters.statuses.filter((s) => s !== status),
                            })
                        }
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label="Remove status filter"
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0.5 text-xs text-muted-foreground"
                onClick={() => onFiltersChange(DEFAULT_ROOM_FILTERS)}
            >
                Clear all
            </Button>
        </div>
    )
}
