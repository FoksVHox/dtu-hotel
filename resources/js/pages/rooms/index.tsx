import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import roomsRoute from '@/routes/rooms'
import { RoomsTable, type Room } from '@/components/rooms-table'

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Room Management', href: roomsRoute.index().url },
]

export default function RoomsIndex({ rooms }: { rooms: Room[] }) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Room Management" />

       <div className="flex flex-1 flex-col gap-4 p-4">
              <RoomsTable rooms={rooms ?? []} />
            </div>
          </AppLayout>
  )
}
