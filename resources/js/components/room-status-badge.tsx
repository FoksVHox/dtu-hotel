import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: 'Pending', className: 'border-blue-500/40 text-blue-400' },
  2: { label: 'Confirmed', className: 'border-cyan-500/40 text-cyan-400' },
  3: { label: 'Checked In', className: 'border-green-500/40 text-green-400' },
  4: { label: 'Checked Out', className: 'border-zinc-500/40 text-zinc-300' },
  5: { label: 'Cancelled', className: 'border-pink-500/40 text-pink-400' },
  6: { label: 'Maintenance', className: 'border-amber-500/40 text-amber-400' },
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
