import { Head, router } from '@inertiajs/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { CheckCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/RoomController';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import maintenance from '@/routes/maintenance';

type HousekeepingRoom = {
    id: number;
    code: string;
    floor: number;
    checked_out_at: string | null;
    scheduled_cleaning_at: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Housekeeping',
        href: maintenance.index().url,
    },
];

type SortDir = 'asc' | 'desc';

export default function MaintenanceIndex({
    cleaningRooms,
}: {
    cleaningRooms: HousekeepingRoom[];
}) {
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [schedulingId, setSchedulingId] = useState<number | null>(null);
    const [scheduleValue, setScheduleValue] = useState('');

    const sortedRooms = useMemo(() => {
        const copy = [...cleaningRooms];
        copy.sort((a, b) =>
            sortDir === 'asc' ? a.floor - b.floor : b.floor - a.floor,
        );
        return copy;
    }, [cleaningRooms, sortDir]);

    function toggleSort(): void {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }

    function markClean(roomId: number): void {
        router.patch(update(roomId).url, { status: 1 });
    }

    function saveSchedule(roomId: number): void {
        if (!scheduleValue) {
            return;
        }

        router.patch(update(roomId).url, { scheduled_cleaning_at: scheduleValue });
        setSchedulingId(null);
        setScheduleValue('');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Housekeeping" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {cleaningRooms.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <CheckCheck className="h-8 w-8 text-green-400" />
                            <p className="text-sm font-medium text-foreground">
                                All rooms are clean
                            </p>
                            <p className="text-xs text-muted-foreground">
                                No rooms are awaiting housekeeping right now.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Room
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <button
                                            type="button"
                                            onClick={toggleSort}
                                            className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        >
                                            Floor
                                            <span className="text-muted-foreground">
                                                {sortDir === 'asc' ? '↑' : '↓'}
                                            </span>
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Since Checkout
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Scheduled For
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {sortedRooms.map((room) => (
                                    <tr
                                        key={room.id}
                                        className="hover:bg-white/5"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {room.code}
                                        </td>
                                        <td className="px-4 py-3">
                                            {room.floor}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {room.checked_out_at
                                                ? formatDistanceToNow(
                                                      parseISO(
                                                          room.checked_out_at,
                                                      ),
                                                      { addSuffix: true },
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {schedulingId === room.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="datetime-local"
                                                        className="rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground"
                                                        value={scheduleValue}
                                                        onChange={(e) =>
                                                            setScheduleValue(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            saveSchedule(room.id)
                                                        }
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSchedulingId(
                                                                null,
                                                            );
                                                            setScheduleValue(
                                                                '',
                                                            );
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                                    onClick={() => {
                                                        setSchedulingId(room.id);
                                                        setScheduleValue(
                                                            room.scheduled_cleaning_at
                                                                ? room.scheduled_cleaning_at.slice(
                                                                      0,
                                                                      16,
                                                                  )
                                                                : '',
                                                        );
                                                    }}
                                                >
                                                    {room.scheduled_cleaning_at
                                                        ? new Date(
                                                              room.scheduled_cleaning_at,
                                                          ).toLocaleString()
                                                        : '—'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-green-700 text-white hover:bg-green-800"
                                                    onClick={() =>
                                                        markClean(room.id)
                                                    }
                                                >
                                                    <CheckCheck className="mr-1 h-3 w-3" />
                                                    Mark as Clean
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
