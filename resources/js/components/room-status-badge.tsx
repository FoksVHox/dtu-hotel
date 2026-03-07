import { Badge } from '@/components/ui/badge'

// Status values: 1..4 — keep in sync with the RoomStatus enum used elsewhere in the app. ###DM
// Note: The status values should ideally be typed as RoomStatus, but since this component is used in multiple places with different data sources, we'll keep it as number for flexibility. ###DM
const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: 'Available', className: 'border-green-500/40 text-green-400' },
  2: { label: 'Occupied', className: 'border-red-500/40 text-red-400' },
  3: { label: 'Cleaning', className: 'border-amber-500/40 text-amber-400' },
  4: { label: 'Out of Order', className: 'border-zinc-500/40 text-zinc-400' },
} 

export function RoomStatusBadge({ status }: { status: number }) {
  const cfg = STATUS_CONFIG[status]

  if (!cfg) {
    return (
      <Badge variant="outline" className="border-white/10 text-white/60">
        Unknown
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
