import { Head } from '@inertiajs/react'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoomsTable, type Room } from '@/components/rooms-table'
import AppLayout from '@/layouts/app-layout'
import roomsRoute from '@/routes/rooms'
import type { BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Room Management', href: roomsRoute.index().url },
]

const ROOM_STATUS = {
  Available: 1,
  Occupied: 2,
  Cleaning: 3,
  OutOfOrder: 4,
} as const

export default function RoomsIndex({ rooms }: { rooms: Room[] }) {
  const safeRooms = rooms ?? []

  const counts = useMemo(
    () =>
      safeRooms.reduce(
        (acc, room) => {
          acc.total += 1

          if (room.status === ROOM_STATUS.Available) {
            acc.available += 1
          }

          if (room.status === ROOM_STATUS.Occupied) {
            acc.occupied += 1
          }

          if (room.status === ROOM_STATUS.OutOfOrder) {
            acc.outOfOrder += 1
          }

          return acc
        },
        { total: 0, available: 0, occupied: 0, outOfOrder: 0 },
      ),
    [safeRooms],
  )

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Room Management" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{counts.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{counts.available}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{counts.occupied}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Out of Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{counts.outOfOrder}</p>
            </CardContent>
          </Card>
        </div>

        <RoomsTable rooms={safeRooms} />
      </div>
    </AppLayout>
  )
}
