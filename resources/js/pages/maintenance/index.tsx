import { Head, router } from '@inertiajs/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
    AlertTriangle,
    CalendarDays,
    CheckCheck,
    ClipboardList,
    Plus,
    Search,
    Sparkles,
    Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { store as storeLog } from '@/actions/App/Http/Controllers/MaintenanceLogController';
import { update as updateRoom } from '@/actions/App/Http/Controllers/RoomController';
import { RoomStatusBadge } from '@/components/room-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import maintenance from '@/routes/maintenance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: maintenance.index().url },
];

type MaintenanceLog = {
    id: number;
    action: string;
    maintained_by: string | null;
    performed_at: string;
};

type MaintenanceRoom = {
    id: number;
    code: string | null;
    status: number;
    scheduled_cleaning_at: string | null;
    floor_id: number;
    floor: { id: number; name: string; building: { name: string } };
    room_category: { name: string };
    maintenance_logs: MaintenanceLog[];
};

type SimpleRoom = {
    id: number;
    code: string | null;
    floor: { name: string; building: { name: string } };
    room_category: { name: string };
};

type FloorOption = { id: number; label: string; building_name: string };

type Stats = {
    cleaning: number;
    out_of_order: number;
    scheduled: number;
    logs_today: number;
    logs_this_week: number;
    total_logs: number;
};

type RecentLog = {
    id: number;
    action: string;
    maintained_by: string | null;
    performed_at: string;
    room: { code: string | null; floor: { name: string; building: { name: string } } };
};

type LogForm = {
    room_id: string;
    action: string;
    maintained_by: string;
    performed_at: string;
};

const initialLogForm: LogForm = {
    room_id: '',
    action: '',
    maintained_by: '',
    performed_at: new Date().toISOString().slice(0, 16),
};

export default function MaintenanceIndex({
    rooms,
    allRooms,
    floors,
    stats,
    recentLogs,
}: {
    rooms: MaintenanceRoom[];
    allRooms: SimpleRoom[];
    floors: FloorOption[];
    stats: Stats;
    recentLogs: RecentLog[];
}) {
    const [search, setSearch] = useState('');
    const [filterBuilding, setFilterBuilding] = useState('');
    const [filterFloor, setFilterFloor] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [selectedRoom, setSelectedRoom] = useState<MaintenanceRoom | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [logDialogOpen, setLogDialogOpen] = useState(false);
    const [logForm, setLogForm] = useState<LogForm>(initialLogForm);

    const [schedulingId, setSchedulingId] = useState<number | null>(null);
    const [scheduleValue, setScheduleValue] = useState('');

    const buildings = useMemo(
        () => Array.from(new Set(floors.map((f) => f.building_name))).sort(),
        [floors],
    );

    const floorOptions = useMemo(
        () => (filterBuilding ? floors.filter((f) => f.building_name === filterBuilding) : floors),
        [floors, filterBuilding],
    );

    const filtered = useMemo(() => {
        let result = rooms;
        if (filterBuilding) result = result.filter((r) => r.floor.building.name === filterBuilding);
        if (filterFloor) result = result.filter((r) => String(r.floor_id) === filterFloor);
        if (filterStatus) result = result.filter((r) => String(r.status) === filterStatus);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (r) =>
                    (r.code ?? '').toLowerCase().includes(q) ||
                    r.floor.name.toLowerCase().includes(q) ||
                    r.floor.building.name.toLowerCase().includes(q) ||
                    r.room_category.name.toLowerCase().includes(q) ||
                    (r.status === 2 ? 'cleaning' : 'out of order').includes(q),
            );
        }
        return result;
    }, [rooms, filterBuilding, filterFloor, filterStatus, search]);

    function markAvailable(roomId: number): void {
        router.patch(
            updateRoom({ room: roomId }).url,
            { status: 0 },
            {
                onSuccess: () => toast.success('Room marked as available.'),
                onError: () => toast.error('Failed to update room.'),
            },
        );
    }

    function saveSchedule(roomId: number): void {
        if (!scheduleValue) return;
        router.patch(
            updateRoom({ room: roomId }).url,
            { scheduled_cleaning_at: scheduleValue },
            {
                onSuccess: () => {
                    setSchedulingId(null);
                    setScheduleValue('');
                    toast.success('Cleaning scheduled.');
                },
            },
        );
    }

    function handleCreateLog(): void {
        if (!logForm.room_id || !logForm.action || !logForm.performed_at) return;
        router.post(
            storeLog().url,
            {
                room_id: Number(logForm.room_id),
                action: logForm.action,
                maintained_by: logForm.maintained_by || null,
                performed_at: logForm.performed_at,
            },
            {
                onSuccess: () => {
                    setLogDialogOpen(false);
                    setLogForm(initialLogForm);
                    toast.success('Maintenance log created.');
                },
                onError: () => toast.error('Failed to create log.'),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="size-4 text-muted-foreground" />
                                Needs Attention
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Being cleaned</span>
                                <span className="text-sm font-semibold">{stats.cleaning}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Out of order</span>
                                <span className="text-sm font-semibold">{stats.out_of_order}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-sm font-semibold">{stats.cleaning + stats.out_of_order}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarDays className="size-4 text-muted-foreground" />
                                Scheduled Cleaning
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Rooms scheduled</span>
                                <span className="text-sm font-semibold">{stats.scheduled}</span>
                            </div>
                            <Separator />
                            <p className="text-xs text-muted-foreground">
                                Click any row to set or update the schedule
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardList className="size-4 text-muted-foreground" />
                                Maintenance Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Today</span>
                                <span className="text-sm font-semibold">{stats.logs_today}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">This week</span>
                                <span className="text-sm font-semibold">{stats.logs_this_week}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">All time</span>
                                <span className="text-sm font-semibold">{stats.total_logs}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertTriangle className="size-4 text-muted-foreground" />
                                Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Rooms in table</span>
                                <span className="text-sm font-semibold">{rooms.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Filtered</span>
                                <span className="text-sm font-semibold">{filtered.length}</span>
                            </div>
                            <Separator />
                            <p className="text-xs text-muted-foreground">
                                {stats.cleaning + stats.out_of_order === 0
                                    ? '✓ All rooms operational'
                                    : `${stats.cleaning + stats.out_of_order} room(s) need attention`}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search rooms..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 w-48 pl-8 text-sm"
                            />
                        </div>

                        <Select
                            value={filterBuilding || '__all__'}
                            onValueChange={(v) => {
                                setFilterBuilding(v === '__all__' ? '' : v);
                                setFilterFloor('');
                            }}
                        >
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="Building" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All buildings</SelectItem>
                                {buildings.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterFloor || '__all__'}
                            onValueChange={(v) => setFilterFloor(v === '__all__' ? '' : v)}
                        >
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue>
                                    {filterFloor
                                        ? (floorOptions.find((f) => String(f.id) === filterFloor)?.label.split(' — ')[1] ?? 'Floor')
                                        : 'All floors'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All floors</SelectItem>
                                {floorOptions.map((f) => (
                                    <SelectItem key={f.id} value={String(f.id)}>
                                        {f.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterStatus || '__all__'}
                            onValueChange={(v) => setFilterStatus(v === '__all__' ? '' : v)}
                        >
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All statuses</SelectItem>
                                <SelectItem value="2">Cleaning</SelectItem>
                                <SelectItem value="3">Out of Order</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="button" size="sm" onClick={() => setLogDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Log Maintenance
                    </Button>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <CheckCheck className="h-8 w-8 text-green-400" />
                            <p className="text-sm font-medium">All rooms operational</p>
                            <p className="text-xs text-muted-foreground">No rooms need attention right now.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                        <table className="w-full table-fixed text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left">Building</th>
                                    <th className="px-3 py-2 text-left">Floor</th>
                                    <th className="px-3 py-2 text-left">Room Code</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Scheduled</th>
                                    <th className="px-3 py-2 text-left">Maintained By</th>
                                    <th className="px-3 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filtered.map((room) => (
                                    <tr
                                        key={room.id}
                                        className="cursor-pointer hover:bg-white/5"
                                        onClick={() => {
                                            setSelectedRoom(room);
                                            setDetailOpen(true);
                                        }}
                                    >
                                        <td className="px-3 py-2">{room.floor.building.name}</td>
                                        <td className="px-3 py-2">{room.floor.name}</td>
                                        <td className="px-3 py-2 font-medium">{room.code ?? '—'}</td>
                                        <td className="px-3 py-2">
                                            <RoomStatusBadge fallbackStatus={room.status} />
                                        </td>
                                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                            {schedulingId === room.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="datetime-local"
                                                        className="rounded border border-white/10 bg-background px-2 py-0.5 text-xs text-foreground"
                                                        value={scheduleValue}
                                                        onChange={(e) => setScheduleValue(e.target.value)}
                                                    />
                                                    <Button type="button" size="sm" onClick={() => saveSchedule(room.id)}>
                                                        Save
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSchedulingId(null);
                                                            setScheduleValue('');
                                                        }}
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="text-left text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        setSchedulingId(room.id);
                                                        setScheduleValue(
                                                            room.scheduled_cleaning_at
                                                                ? room.scheduled_cleaning_at.slice(0, 16)
                                                                : '',
                                                        );
                                                    }}
                                                >
                                                    {room.scheduled_cleaning_at
                                                        ? formatDistanceToNow(parseISO(room.scheduled_cleaning_at), { addSuffix: true })
                                                        : '— set date'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {room.maintenance_logs[0]?.maintained_by ?? '—'}
                                        </td>
                                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                {room.status === 2 && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="bg-green-700 text-white hover:bg-green-800"
                                                        onClick={() => markAvailable(room.id)}
                                                    >
                                                        <CheckCheck className="mr-1 h-3 w-3" />
                                                        Mark Clean
                                                    </Button>
                                                )}
                                                {room.status === 3 && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="bg-blue-700 text-white hover:bg-blue-800"
                                                        onClick={() => markAvailable(room.id)}
                                                    >
                                                        <Wrench className="mr-1 h-3 w-3" />
                                                        Mark Available
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Recent Logs */}
                {recentLogs.length > 0 && (
                    <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Recent Maintenance Logs</p>
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="w-full table-fixed text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Room</th>
                                        <th className="px-3 py-2 text-left">Action</th>
                                        <th className="px-3 py-2 text-left">Maintained By</th>
                                        <th className="px-3 py-2 text-left">When</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {recentLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-3 py-2 font-medium">
                                                {log.room.floor.building.name} · {log.room.floor.name} · {log.room.code ?? '—'}
                                            </td>
                                            <td className="px-3 py-2">{log.action}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{log.maintained_by ?? '—'}</td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {formatDistanceToNow(parseISO(log.performed_at), { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Detail dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    {selectedRoom && (
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    Room {selectedRoom.code ?? '—'}
                                    <RoomStatusBadge status={selectedRoom.status} />
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedRoom.floor.building.name} · {selectedRoom.floor.name} · {selectedRoom.room_category.name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Scheduled cleaning</span>
                                    <span>
                                        {selectedRoom.scheduled_cleaning_at
                                            ? new Date(selectedRoom.scheduled_cleaning_at).toLocaleString()
                                            : '—'}
                                    </span>
                                </div>

                                <Separator />

                                <p className="text-sm font-medium">Maintenance history</p>
                                {selectedRoom.maintenance_logs.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No logs yet.</p>
                                ) : (
                                    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                                        {selectedRoom.maintenance_logs.map((log) => (
                                            <div key={log.id} className="rounded-lg border border-white/10 p-3 text-sm">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="font-medium">{log.action}</span>
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {formatDistanceToNow(parseISO(log.performed_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                {log.maintained_by && (
                                                    <p className="mt-1 text-xs text-muted-foreground">by {log.maintained_by}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setDetailOpen(false);
                                        setLogForm((prev) => ({ ...prev, room_id: String(selectedRoom.id) }));
                                        setLogDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Log Maintenance
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>

                {/* Create log dialog */}
                <Dialog
                    open={logDialogOpen}
                    onOpenChange={(open) => {
                        setLogDialogOpen(open);
                        if (!open) setLogForm(initialLogForm);
                    }}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Log Maintenance</DialogTitle>
                            <DialogDescription>Record a maintenance action performed on a room.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-2 md:grid-cols-2">
                            <div className="col-span-2 grid gap-2">
                                <Label>Room</Label>
                                <Select
                                    value={logForm.room_id}
                                    onValueChange={(v) => setLogForm((prev) => ({ ...prev, room_id: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allRooms.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.floor.building.name} · {r.floor.name} · {r.code ?? `#${r.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2 grid gap-2">
                                <Label>Action</Label>
                                <Input
                                    placeholder="e.g. Replaced light bulb, Fixed AC..."
                                    value={logForm.action}
                                    onChange={(e) => setLogForm((prev) => ({ ...prev, action: e.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Maintained by</Label>
                                <Input
                                    placeholder="Staff name (optional)"
                                    value={logForm.maintained_by}
                                    onChange={(e) => setLogForm((prev) => ({ ...prev, maintained_by: e.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Performed at</Label>
                                <input
                                    type="datetime-local"
                                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    value={logForm.performed_at}
                                    onChange={(e) => setLogForm((prev) => ({ ...prev, performed_at: e.target.value }))}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setLogDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateLog}
                                disabled={!logForm.room_id || !logForm.action || !logForm.performed_at}
                            >
                                Save Log
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
