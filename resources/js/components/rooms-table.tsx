import { Pencil, Trash2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoomStatusBadge } from '@/components/room-status-badge';

export type Room = {
    id: number;
    code: string;
    category: string;
    floor: number;
    status: number; // enum value 1..4
};

type SortKey = 'code' | 'category' | 'floor' | 'status';

type SortHeaderProps = {
    label: string;
    sortKey: SortKey;
    activeKey: SortKey;
    direction: 'asc' | 'desc';
    onToggle: (key: SortKey) => void;
};

function SortHeader({
    label,
    sortKey,
    activeKey,
    direction,
    onToggle,
}: SortHeaderProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(sortKey)}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
        >
            {label}
            {activeKey === sortKey ? (
                <span className="text-muted-foreground">
                    {direction === 'asc' ? '↑' : '↓'}
                </span>
            ) : null}
        </button>
    );
}

export function RoomsTable({ rooms }: { rooms: Room[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('code');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sortedRooms = useMemo(() => {
        const copy = [...rooms];

        copy.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

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
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <SortHeader
                                label="Room Code"
                                sortKey="code"
                                activeKey={sortKey}
                                direction={sortDir}
                                onToggle={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <SortHeader
                                label="Category"
                                sortKey="category"
                                activeKey={sortKey}
                                direction={sortDir}
                                onToggle={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <SortHeader
                                label="Floor"
                                sortKey="floor"
                                activeKey={sortKey}
                                direction={sortDir}
                                onToggle={toggleSort}
                            />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <SortHeader
                                label="Status"
                                sortKey="status"
                                activeKey={sortKey}
                                direction={sortDir}
                                onToggle={toggleSort}
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
                            <td className="px-4 py-3">{room.category}</td>
                            <td className="px-4 py-3">{room.floor}</td>
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
                                        onClick={() =>
                                            console.log('delete', room.id)
                                        }
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
