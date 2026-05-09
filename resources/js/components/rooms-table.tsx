import { Pencil, Trash2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoomStatusBadge } from '@/components/room-status-badge';

export type Room = {
    id: number;
    code: string | null;
    status: number;
    manual_status: number | null;
    scheduled_cleaning_at: string | null;
    room_category_id: number;
    floor_id: number;
    room_category: { id: number; name: string; description: string };
    floor: { id: number; name: string; building: { name: string } };
};

type SortKey = 'building' | 'floor' | 'code' | 'category' | 'status';

function getSortValue(room: Room, key: SortKey): string | number {
    if (key === 'building') return room.floor.building.name;
    if (key === 'floor') return room.floor.name;
    if (key === 'category') return room.room_category.name;
    if (key === 'code') return room.code ?? '';
    return room.status;
}

type SortHeaderProps = {
    label: string;
    sortKey: SortKey;
    activeKey: SortKey;
    direction: 'asc' | 'desc';
    onToggle: (key: SortKey) => void;
};

function SortHeader({ label, sortKey, activeKey, direction, onToggle }: SortHeaderProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(sortKey)}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
        >
            {label}
            {activeKey === sortKey ? (
                <span className="text-muted-foreground">{direction === 'asc' ? '↑' : '↓'}</span>
            ) : null}
        </button>
    );
}

export function RoomsTable({
    rooms,
    onEdit,
    onDelete,
}: {
    rooms: Room[];
    onEdit?: (room: Room) => void;
    onDelete?: (id: number) => void;
}) {
    const [sortKey, setSortKey] = useState<SortKey>('code');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sortedRooms = useMemo(() => {
        const copy = [...rooms];

        copy.sort((a, b) => {
            const aVal = getSortValue(a, sortKey);
            const bVal = getSortValue(b, sortKey);

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
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    if (!rooms.length) {
        return (
            <div className="rounded-xl border border-white/10 p-6 text-sm text-white/60">
                No rooms exist yet
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full table-fixed text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-3 py-2 text-left">
                            <SortHeader label="Building" sortKey="building" activeKey={sortKey} direction={sortDir} onToggle={toggleSort} />
                        </th>
                        <th className="px-3 py-2 text-left">
                            <SortHeader label="Floor" sortKey="floor" activeKey={sortKey} direction={sortDir} onToggle={toggleSort} />
                        </th>
                        <th className="px-3 py-2 text-left">
                            <SortHeader label="Room Code" sortKey="code" activeKey={sortKey} direction={sortDir} onToggle={toggleSort} />
                        </th>
                        <th className="px-3 py-2 text-left">
                            <SortHeader label="Category" sortKey="category" activeKey={sortKey} direction={sortDir} onToggle={toggleSort} />
                        </th>
                        <th className="px-3 py-2 text-left">
                            <SortHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onToggle={toggleSort} />
                        </th>
                        <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                    {sortedRooms.map((room) => (
                        <tr key={room.id} className="hover:bg-white/5">
                            <td className="px-3 py-2">{room.floor.building.name}</td>
                            <td className="px-3 py-2">{room.floor.name}</td>
                            <td className="px-3 py-2 font-medium">{room.code ?? '—'}</td>
                            <td className="px-3 py-2">{room.room_category.name}</td>
                            <td className="px-3 py-2">
                                <RoomStatusBadge
                                    status={null}
                                    fallbackStatus={room.status}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="rounded-md border border-white/10 p-2 hover:bg-white/5"
                                        title="Edit"
                                        onClick={() => onEdit?.(room)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>

                                    <button
                                        className="rounded-md border border-white/10 p-2 hover:bg-white/5"
                                        title="Maintenance"
                                        onClick={() => console.log('maintenance', room.id)}
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
