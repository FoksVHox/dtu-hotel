import { Head, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { destroy as destroyRoom, store as storeRoom, update as updateRoom } from '@/actions/App/Http/Controllers/RoomController';
import { ROOM_STATUS_CONFIG, STATUS_CONFIG } from '@/components/room-status-badge';
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
type FloorOption = { id: number; label: string; building_name: string };

type RoomForm = {
    code: string;
    room_category_id: string;
    floor_id: string;
    status: string;
};

type EditForm = {
    code: string;
    room_category_id: string;
    floor_id: string;
    status: string;
};

const initialForm: RoomForm = { code: '', room_category_id: '', floor_id: '', status: '' };
const initialEditForm: EditForm = { code: '', room_category_id: '', floor_id: '', status: '' };

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
    const [addBuilding, setAddBuilding] = useState('');

    const addFloorOptions = useMemo(() =>
        addBuilding ? floors.filter((f) => f.building_name === addBuilding) : floors,
    [floors, addBuilding]);
    const [filters, setFilters] = useState<RoomFilters>(DEFAULT_ROOM_FILTERS);
    const [search, setSearch] = useState('');

    const [editRoom, setEditRoom] = useState<Room | null>(null);
    const [editForm, setEditForm] = useState<EditForm>(initialEditForm);
    const [editBuilding, setEditBuilding] = useState('');
    const [isEditSaving, setIsEditSaving] = useState(false);

    const buildingsFromFloors = useMemo(() =>
        Array.from(new Set(floors.map((f) => f.building_name))).sort(),
    [floors]);

    const editFloorOptions = useMemo(() =>
        editBuilding ? floors.filter((f) => f.building_name === editBuilding) : floors,
    [floors, editBuilding]);

    const categoryOptions = useMemo(() =>
        Array.from(new Set(localRooms.map((r) => r.room_category.name))).sort(),
    [localRooms]);

    const floorOptions = useMemo(() =>
        Array.from(new Set(localRooms.map((r) => r.floor.name))).sort(),
    [localRooms]);

    const buildingOptions = useMemo(() =>
        Array.from(new Set(localRooms.map((r) => r.floor.building.name))).sort(),
    [localRooms]);

    const filteredRooms = useMemo(() => {
        let result = localRooms;

        if (filters.buildings.length > 0) {
            result = result.filter((r) => filters.buildings.includes(r.floor.building.name));
        }

        if (filters.floors.length > 0) {
            result = result.filter((r) => filters.floors.includes(r.floor.name));
        }

        if (filters.categories.length > 0) {
            result = result.filter((r) => filters.categories.includes(r.room_category.name));
        }

        if (filters.statuses.length > 0) {
            result = result.filter((r) => filters.statuses.includes(r.status));
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((r) => {
                const statusLabel = (
                    r.manual_status != null
                        ? STATUS_CONFIG[r.manual_status as keyof typeof STATUS_CONFIG]?.label
                        : ROOM_STATUS_CONFIG[r.status]?.label
                )?.toLowerCase() ?? '';
                return (
                    (r.code ?? '').toLowerCase().includes(q) ||
                    r.room_category.name.toLowerCase().includes(q) ||
                    r.floor.name.toLowerCase().includes(q) ||
                    r.floor.building.name.toLowerCase().includes(q) ||
                    statusLabel.includes(q)
                );
            });
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
        const currentFloor = floors.find((f) => f.id === room.floor_id);
        setEditBuilding(currentFloor?.building_name ?? '');
        setEditRoom(room);
        setEditForm({
            code: room.code ?? '',
            room_category_id: String(room.room_category_id),
            floor_id: String(room.floor_id),
            status: String(room.status),
        });
    }

    function handleSaveEdit(): void {
        if (!editRoom || !canSaveEdit) return;
        setIsEditSaving(true);
        router.patch(
            updateRoom({ room: editRoom.id }).url,
            {
                code: editForm.code !== '' ? editForm.code : null,
                room_category_id: Number(editForm.room_category_id),
                floor_id: Number(editForm.floor_id),
                status: editForm.status !== '' ? Number(editForm.status) : null,
                manual_status: null,
            },
            {
                onSuccess: () => {
                    setEditRoom(null);
                    setIsEditSaving(false);
                },
                onError: () => setIsEditSaving(false),
            },
        );
    }

    function handleDeleteRoom(roomId: number): void {
        router.delete(destroyRoom({ room: roomId }).url);
    }

    function resetForm(): void {
        setForm(initialForm);
        setAddBuilding('');
    }

    function handleAddRoom(): void {
        if (!canSave) return;
        router.post(
            storeRoom().url,
            {
                code: form.code !== '' ? form.code : null,
                room_category_id: Number(form.room_category_id),
                floor_id: Number(form.floor_id),
                status: form.status !== '' ? Number(form.status) : null,
            },
            {
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
                                <Label>Building</Label>
                                <Select
                                    value={addBuilding}
                                    onValueChange={(value) => {
                                        setAddBuilding(value);
                                        setForm((prev) => ({ ...prev, floor_id: '' }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select building" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buildingsFromFloors.map((b) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
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
                                        {addFloorOptions.map((floor) => (
                                            <SelectItem key={floor.id} value={String(floor.id)}>
                                                {floor.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Room Code</Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                    placeholder="e.g. 101"
                                />
                            </div>

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
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({ ...prev, status: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Available</SelectItem>
                                        <SelectItem value="1">Occupied</SelectItem>
                                        <SelectItem value="2">Cleaning</SelectItem>
                                        <SelectItem value="3">Out of Order</SelectItem>
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
                                <Label>Building</Label>
                                <Select
                                    value={editBuilding}
                                    onValueChange={(value) => {
                                        setEditBuilding(value);
                                        setEditForm((prev) => ({ ...prev, floor_id: '' }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select building" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buildingsFromFloors.map((b) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
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
                                        {editFloorOptions.map((floor) => (
                                            <SelectItem key={floor.id} value={String(floor.id)}>
                                                {floor.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Room Code</Label>
                                <Input
                                    value={editForm.code}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                    placeholder="e.g. 101"
                                />
                            </div>

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
                                <Label>Status</Label>
                                <Select
                                    value={editForm.status}
                                    onValueChange={(value) =>
                                        setEditForm((prev) => ({ ...prev, status: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Available</SelectItem>
                                        <SelectItem value="1">Occupied</SelectItem>
                                        <SelectItem value="2">Cleaning</SelectItem>
                                        <SelectItem value="3">Out of Order</SelectItem>
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
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">—</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">—</p>
                            <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">—</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">—</p>
                            <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">—</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">—</p>
                            <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">—</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">—</p>
                            <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
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
                        buildings={buildingOptions}
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
