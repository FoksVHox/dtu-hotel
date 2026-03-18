import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoomsTable, type Room } from '@/components/rooms-table';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    BOOKING_STATUSES,
    BookingStatus,
    type BookingStatus as BookingStatusValue,
} from '@/types/calendar';
import roomsRoute from '@/routes/rooms';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Room Management', href: roomsRoute.index().url },
];

const ROOM_STATUS_OPTIONS: BookingStatusValue[] = [
    BookingStatus.Unknown,
    BookingStatus.Pending,
    BookingStatus.Confirmed,
    BookingStatus.CheckedIn,
    BookingStatus.CheckedOut,
    BookingStatus.Cancelled,
    BookingStatus.Maintenance,
];

const EMPTY_STATUS_COUNTS: Record<BookingStatusValue, number> = {
    [BookingStatus.Unknown]: 0,
    [BookingStatus.Pending]: 0,
    [BookingStatus.Confirmed]: 0,
    [BookingStatus.CheckedIn]: 0,
    [BookingStatus.CheckedOut]: 0,
    [BookingStatus.Cancelled]: 0,
    [BookingStatus.Maintenance]: 0,
};

function getRoomStatusLabel(status: BookingStatusValue): string {
    return BOOKING_STATUSES[status].label;
}

type RoomForm = {
    code: string;
    category: string;
    floor: string;
    status: string;
};

const initialForm: RoomForm = {
    code: '',
    category: '',
    floor: '',
    status: '',
};

export default function RoomsIndex({ rooms }: { rooms?: Room[]  } ) {
    const safeRooms = rooms ?? [];
    const [localRooms, setLocalRooms] = useState<Room[]>(safeRooms);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [form, setForm] = useState<RoomForm>(initialForm);

    const counts = useMemo(
        () => {
            const byStatus = { ...EMPTY_STATUS_COUNTS };

            localRooms.forEach((room) => {
                if (Object.hasOwn(byStatus, room.status)) {
                    byStatus[room.status] += 1;
                } else {
                    byStatus[BookingStatus.Unknown] += 1;
                }
            });

            return {
                total: localRooms.length,
                byStatus,
            };
        },
        [localRooms],
    );

    const categoryOptions = useMemo(() => {
        const unique = Array.from(
            new Set(localRooms.map((room) => room.room_category.id)),
        );
        return unique.length ? unique : ['Single', 'Double', 'Suite'];
    }, [localRooms]);

    const floorOptions = useMemo(() => {
        const unique = Array.from(
            new Set(localRooms.map((room) => room.floor.name)),
        ).sort((a, b) => a - b);
        return unique.length ? unique : [1, 2, 3];
    }, [localRooms]);

    const canSave =
        form.code.trim().length > 0 &&
        form.category.length > 0 &&
        form.floor.length > 0 &&
        form.status.length > 0;

    function handleDeleteRoom(roomId: number): void {
        setLocalRooms((prev) => prev.filter((room) => room.id !== roomId));
    }

    function resetForm(): void {
        setForm(initialForm);
    }

    function handleAddRoom(): void {
        if (!canSave) {
            return;
        }

        const nextId = localRooms.length
            ? Math.max(...localRooms.map((room) => room.id)) + 1
            : 1;

        const newRoom: Room = {
            id: nextId,
            code: form.code.trim(),
            category: form.category,
            floor: Number(form.floor),
            status: Number(form.status),
        };

        setLocalRooms((prev) => [...prev, newRoom]);
        setIsAddRoomOpen(false);
        resetForm();
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Room Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex justify-end">
                    <Button
                        type="button"
                        className="bg-red-700 text-white shadow-sm hover:bg-red-800"
                        onClick={() => setIsAddRoomOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Add Room
                    </Button>
                </div>

                <Dialog
                    open={isAddRoomOpen}
                    onOpenChange={(open) => {
                        setIsAddRoomOpen(open);
                        if (!open) {
                            resetForm();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Room</DialogTitle>
                            <DialogDescription>
                                Fill out the room details and save.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="room-code">Room Code</Label>
                                <Input
                                    id="room-code"
                                    placeholder="e.g. A203"
                                    value={form.code}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            code: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="room-category">Category</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            category: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="room-category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoryOptions.map((category) => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Floor</Label>
                                <Select
                                    value={form.floor}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            floor: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select floor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {floorOptions.map((floor) => (
                                            <SelectItem
                                                key={floor}
                                                value={String(floor)}
                                            >
                                                {floor}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROOM_STATUS_OPTIONS.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={String(status)}
                                            >
                                                {getRoomStatusLabel(status)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsAddRoomOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-red-700 text-white hover:bg-red-800"
                                onClick={handleAddRoom}
                                disabled={!canSave}
                            >
                                Save Room
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">
                                Total Rooms
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {counts.total}
                            </p>
                        </CardContent>
                    </Card>

                    {ROOM_STATUS_OPTIONS.map((status) => (
                        <Card key={status}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">
                                    {getRoomStatusLabel(status)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold">
                                    {counts.byStatus[status]}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <RoomsTable rooms={localRooms} onDelete={handleDeleteRoom} />
            </div>
        </AppLayout>
    );
}
