import { Head, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { store as storeRoom, update as updateRoom } from '@/actions/App/Http/Controllers/RoomController';
import { RoomsTable, type Room } from '@/components/rooms-table';
import { RoomFilterBar } from '@/components/rooms/room-filter-bar';
import {
    RoomFilterSheet,
    DEFAULT_ROOM_FILTERS,
    type RoomFilters,
} from '@/components/rooms/room-filter-sheet';
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
import roomsRoute from '@/routes/rooms';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Room Management', href: roomsRoute.index().url },
];

type CategoryOption = { id: number; name: string };
type FloorOption = { id: number; label: string };

type RoomForm = {
    room_category_id: string;
    floor_id: string;
    manual_status: string;
};

type EditForm = {
    room_category_id: string;
    floor_id: string;
    manual_status: string;
};

const initialForm: RoomForm = { room_category_id: '', floor_id: '', manual_status: '' };
const initialEditForm: EditForm = { room_category_id: '', floor_id: '', manual_status: '' };

export default function RoomsIndex({
    rooms,
    categories = [],
    floors = [],
}: {
    rooms?: Room[];
    categories?: CategoryOption[];
    floors?: FloorOption[];
}) {
    const safeRooms = rooms ?? [];

    const [localRooms, setLocalRooms] = useState<Room[]>(safeRooms);

    useEffect(() => {
        setLocalRooms(rooms ?? []);
    }, [rooms]);

    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [form, setForm] = useState<RoomForm>(initialForm);
    const [filters, setFilters] = useState<RoomFilters>(DEFAULT_ROOM_FILTERS);
    const [search, setSearch] = useState('');

    const [editRoom, setEditRoom] = useState<Room | null>(null);
    const [editForm, setEditForm] = useState<EditForm>(initialEditForm);
    const [isEditSaving, setIsEditSaving] = useState(false);

    const counts = useMemo(
        () =>
            localRooms.reduce(
                (acc, room) => {
                    acc.total += 1;
                    if (room.status === 0) acc.available += 1;
                    if (room.status === 1) acc.occupied += 1;
                    if (room.status === 3) acc.outOfOrder += 1;
                    return acc;
                },
                { total: 0, available: 0, occupied: 0, outOfOrder: 0 },
            ),
        [localRooms],
    );

    const categoryOptions = useMemo(() => {
        const unique = Array.from(new Set(localRooms.map((room) => room.category)));
        return unique.length ? unique : ['Single', 'Double', 'Suite'];
    }, [localRooms]);

    const floorOptions = useMemo(() => {
        const unique = Array.from(new Set(localRooms.map((room) => room.floor))).sort(
            (a, b) => a - b,
        );
        return unique.length ? unique : [1, 2, 3];
    }, [localRooms]);

    const filteredRooms = useMemo(() => {
        let result = localRooms;

        if (filters.categories.length > 0) {
            result = result.filter((r) => filters.categories.includes(r.category));
        }

        if (filters.floors.length > 0) {
            result = result.filter((r) => filters.floors.includes(r.floor));
        }

        if (filters.statuses.length > 0) {
            result = result.filter(
                (r) => r.booking_status !== null && filters.statuses.includes(r.booking_status),
            );
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(
                (r) =>
                    r.code.toLowerCase().includes(q) ||
                    r.category.toLowerCase().includes(q) ||
                    String(r.floor).includes(q),
            );
        }

        return result;
    }, [localRooms, filters, search]);

    const canSave =
        form.room_category_id.length > 0 &&
        form.floor_id.length > 0;

    const canSaveEdit =
        editForm.room_category_id.length > 0 &&
        editForm.floor_id.length > 0;

    function handleOpenEdit(room: Room): void {
        setEditRoom(room);
        setEditForm({
            room_category_id: String(room.room_category_id),
            floor_id: String(room.floor_id),
            manual_status: room.manual_status != null ? String(room.manual_status) : '',
        });
    }

    function handleSaveEdit(): void {
        if (!editRoom || !canSaveEdit) return;
        setIsEditSaving(true);
        router.patch(
            updateRoom({ room: editRoom.id }).url,
            {
                room_category_id: Number(editForm.room_category_id),
                floor_id: Number(editForm.floor_id),
                manual_status: editForm.manual_status !== '' ? Number(editForm.manual_status) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditRoom(null);
                    setIsEditSaving(false);
                },
                onError: () => setIsEditSaving(false),
            },
        );
    }

    function handleDeleteRoom(roomId: number): void {
        setLocalRooms((prev) => prev.filter((room) => room.id !== roomId));
    }

    function resetForm(): void {
        setForm(initialForm);
    }

    function handleAddRoom(): void {
        if (!canSave) return;
        router.post(
            storeRoom().url,
            {
                room_category_id: Number(form.room_category_id),
                floor_id: Number(form.floor_id),
                manual_status: form.manual_status !== '' ? Number(form.manual_status) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddRoomOpen(false);
                    resetForm();
                },
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Room Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Add Room dialog */}
                <Dialog
                    open={isAddRoomOpen}
                    onOpenChange={(open) => {
                        setIsAddRoomOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Room</DialogTitle>
                            <DialogDescription>Fill out the room details and save.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={form.room_category_id}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({ ...prev, room_category_id: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Floor</Label>
                                <Select
                                    value={form.floor_id}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({ ...prev, floor_id: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select floor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {floors.map((floor) => (
                                            <SelectItem key={floor.id} value={String(floor.id)}>
                                                {floor.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.manual_status}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({ ...prev, manual_status: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Pending</SelectItem>
                                        <SelectItem value="2">Confirmed</SelectItem>
                                        <SelectItem value="3">Checked In</SelectItem>
                                        <SelectItem value="4">Checked Out</SelectItem>
                                        <SelectItem value="5">Cancelled</SelectItem>
                                        <SelectItem value="6">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsAddRoomOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleAddRoom} disabled={!canSave}>
                                Save Room
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Room dialog */}
                <Dialog
                    open={editRoom !== null}
                    onOpenChange={(open) => { if (!open) setEditRoom(null); }}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Room: {editRoom?.code}</DialogTitle>
                            <DialogDescription>Update the room details and save.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={editForm.room_category_id}
                                    onValueChange={(value) =>
                                        setEditForm((prev) => ({ ...prev, room_category_id: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Floor</Label>
                                <Select
                                    value={editForm.floor_id}
                                    onValueChange={(value) =>
                                        setEditForm((prev) => ({ ...prev, floor_id: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select floor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {floors.map((floor) => (
                                            <SelectItem key={floor.id} value={String(floor.id)}>
                                                {floor.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={editForm.manual_status}
                                    onValueChange={(value) =>
                                        setEditForm((prev) => ({ ...prev, manual_status: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Pending</SelectItem>
                                        <SelectItem value="2">Confirmed</SelectItem>
                                        <SelectItem value="3">Checked In</SelectItem>
                                        <SelectItem value="4">Checked Out</SelectItem>
                                        <SelectItem value="5">Cancelled</SelectItem>
                                        <SelectItem value="6">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setEditRoom(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={!canSaveEdit || isEditSaving}
                            >
                                {isEditSaving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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

                <div className="flex items-center justify-end gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search rooms..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-48 pl-8 text-sm"
                        />
                    </div>
                    <RoomFilterSheet
                        filters={filters}
                        onFiltersChange={setFilters}
                        categories={categoryOptions}
                        floors={floorOptions}
                    />
                    <Button type="button" size="sm" onClick={() => setIsAddRoomOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Add Room
                    </Button>
                </div>

                <RoomFilterBar filters={filters} onFiltersChange={setFilters} />

                <RoomsTable
                    rooms={filteredRooms}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteRoom}
                />
            </div>
        </AppLayout>
    );
}
