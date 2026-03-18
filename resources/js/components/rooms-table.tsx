import { Pencil, Trash2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoomStatusBadge } from '@/components/room-status-badge';
import type { BookingStatus } from '@/types/calendar';

export type Room = {
    id: number;
    code: string;
    status: BookingStatus;
    floor: {
        id: number;
        name: string;
        code: string;
        building_id: number;
        hotel_id: number;
        created_at?: string;
        updated_at?: string;
    };
    room_category: {
        id: number;
        name: string;
        description?: string | null;
        created_at?: string;
        updated_at?: string;
        deleted_at?: string | null;
    };
};

type SortKey = 'code' | 'category' | 'floor' | 'status';

type ThProps = {
    label: string;
    k: SortKey;
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    toggleSort: (key: SortKey) => void;
};

const Th = ({ label, k, sortKey, sortDir, toggleSort }: ThProps) => (
    <button
        type="button"
        onClick={() => toggleSort(k)}
        className="flex items-center gap-2 transition-colors hover:text-foreground"
    >
        {label}
        {sortKey === k ? (
            <span className="text-muted-foreground">
                {sortDir === 'asc' ? '↑' : '↓'}
            </span>
        ) : null}
    </button>
);

export function RoomsTable({
    rooms,
    onDelete,
}: {
    rooms: Room[];
    onDelete?: (roomId: number) => void;
}) {
    const [sortKey, setSortKey] = useState<SortKey>('code');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sortedRooms = useMemo(() => {
        const copy = [...rooms];

        copy.sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            switch (sortKey) {
                case 'code':
                    aVal = a.code;
                    bVal = b.code;
                    break;
                case 'category':
                    aVal = a.room_category?.name ?? '';
                    bVal = b.room_category?.name ?? '';
                    break;
                case 'floor':
                    aVal = a.floor?.name ?? '';
                    bVal = b.floor?.name ?? '';
                    break;
                case 'status':
                    aVal = a.status;
                    bVal = b.status;
                    break;
                default:
                    aVal = '';
                    bVal = '';
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return sortDir === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });

        return copy;
    }, [rooms, sortKey, sortDir]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    if (!rooms.length) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No rooms exist yet
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <Th
                                label="Room Code"
                                k="code"
                                sortKey={sortKey}
                                sortDir={sortDir}
                                toggleSort={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <Th
                                label="Category"
                                k="category"
                                sortKey={sortKey}
                                sortDir={sortDir}
                                toggleSort={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <Th
                                label="Floor"
                                k="floor"
                                sortKey={sortKey}
                                sortDir={sortDir}
                                toggleSort={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <Th
                                label="Status"
                                k="status"
                                sortKey={sortKey}
                                sortDir={sortDir}
                                toggleSort={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {sortedRooms.map((room) => (
                        <tr key={room.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 font-medium">
                                {room.code}
                            </td>
                            <td className="px-4 py-3">{room.room_category?.name}</td>
                            <td className="px-4 py-3">{room.floor?.name}</td>
                            <td className="px-4 py-3">
                                <RoomStatusBadge status={room.status} />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="rounded-md border border-white/10 p-2 hover:bg-white/5"
                                        title="Edit"
                                        onClick={() =>
                                            console.log('edit', room.id)
                                        }
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="rounded-md border border-white/10 p-2 hover:bg-white/5"
                                        title="Maintenance"
                                        onClick={() =>
                                            console.log('maintenance', room.id)
                                        }
                                    >
                                        <Wrench className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="rounded-md border border-white/10 p-2 hover:bg-white/5"
                                        title="Delete"
                                        onClick={() => onDelete?.(room.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
