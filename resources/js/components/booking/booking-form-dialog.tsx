import { useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    CalendarPlus,
    Pencil,
    Plus,
    Search,
    UserPlus,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DateTimePicker } from '@/components/booking/date-time-picker';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { CreateBookingForm, NewGuest, SearchGuest } from '@/types/booking';
import type { CalendarBooking, CalendarRoom } from '@/types/calendar';
import { BookingStatus } from '@/types/calendar';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/BookingController';
import SearchGuests from '@/actions/App/Http/Controllers/SearchGuestsController';

const BOOKING_STATUS_OPTIONS = [
    { value: BookingStatus.Pending, label: 'Pending' },
    { value: BookingStatus.Confirmed, label: 'Confirmed' },
    { value: BookingStatus.CheckedIn, label: 'Checked In' },
] as const;

interface BookingFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rooms: CalendarRoom[];
    booking?: CalendarBooking | null;
}

export function BookingFormDialog({
    open,
    onOpenChange,
    rooms,
    booking,
}: BookingFormDialogProps) {
    const isEditing = !!booking;

    const { data, setData, post, put, processing, reset, clearErrors } =
        useForm<CreateBookingForm>({
            room_ids: [],
            guest_ids: [],
            new_guests: [],
            start: '',
            end: '',
            status: BookingStatus.Pending,
        });

    const [selectedGuests, setSelectedGuests] = useState<SearchGuest[]>([]);
    const [newGuests, setNewGuests] = useState<NewGuest[]>([]);
    const [guestQuery, setGuestQuery] = useState('');
    const [guestResults, setGuestResults] = useState<SearchGuest[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showNewGuestForm, setShowNewGuestForm] = useState(false);
    const [newGuestDraft, setNewGuestDraft] = useState<NewGuest>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });

    const [newGuestErrors, setNewGuestErrors] = useState<
        Partial<Record<keyof NewGuest, string>>
    >({});

    const [roomQuery, setRoomQuery] = useState('');
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (open && booking) {
            setData({
                room_ids: booking.rooms.map((r) => r.id),
                guest_ids: booking.guests.map((g) => g.id),
                new_guests: [],
                start: format(parseISO(booking.start), "yyyy-MM-dd'T'HH:mm"),
                end: format(parseISO(booking.end), "yyyy-MM-dd'T'HH:mm"),
                status: booking.status,
            });
            setSelectedGuests(
                booking.guests.map((g) => ({
                    id: g.id,
                    first_name: g.first_name,
                    last_name: g.last_name,
                    email: g.email,
                    phone: g.phone,
                })),
            );
            setNewGuests([]);
        }
    }, [open, booking]);

    const filteredRooms = roomQuery.trim()
        ? rooms.filter((room) => {
              const q = roomQuery.toLowerCase();
              return (
                  room.room_category?.name?.toLowerCase().includes(q) ||
                  room.floor?.code?.toLowerCase().includes(q)
              );
          })
        : rooms;

    const canSubmit =
        data.start !== '' &&
        data.end !== '' &&
        data.room_ids.length >= 1 &&
        selectedGuests.length + newGuests.length >= 1;

    const searchGuests = useCallback(
        (query: string) => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            if (query.length < 1) {
                setGuestResults([]);
                return;
            }

            searchTimeoutRef.current = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const response = await fetch(
                        SearchGuests.url({ query: { q: query } }),
                    );
                    if (!response.ok) {
                        setGuestResults([]);
                        return;
                    }
                    const results: SearchGuest[] = await response.json();
                    setGuestResults(
                        results.filter((g) => !data.guest_ids.includes(g.id)),
                    );
                } catch {
                    setGuestResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        },
        [data.guest_ids],
    );

    function handleGuestQueryChange(value: string) {
        setGuestQuery(value);
        searchGuests(value);
    }

    function selectExistingGuest(guest: SearchGuest) {
        setSelectedGuests((prev) => [...prev, guest]);
        setData('guest_ids', [...data.guest_ids, guest.id]);
        setGuestQuery('');
        setGuestResults([]);
    }

    function removeExistingGuest(guestId: number) {
        setSelectedGuests((prev) => prev.filter((g) => g.id !== guestId));
        setData(
            'guest_ids',
            data.guest_ids.filter((id) => id !== guestId),
        );
    }

    function validateNewGuestDraft(): Partial<Record<keyof NewGuest, string>> {
        const draftErrors: Partial<Record<keyof NewGuest, string>> = {};

        if (!newGuestDraft.first_name.trim()) {
            draftErrors.first_name = 'First name is required.';
        }
        if (!newGuestDraft.last_name.trim()) {
            draftErrors.last_name = 'Last name is required.';
        }
        if (!newGuestDraft.email.trim()) {
            draftErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newGuestDraft.email)) {
            draftErrors.email = 'Please enter a valid email address.';
        }
        if (
            newGuestDraft.phone.trim() &&
            !/^[+\d\s()-]+$/.test(newGuestDraft.phone)
        ) {
            draftErrors.phone = 'Please enter a valid phone number.';
        }

        return draftErrors;
    }

    function addNewGuest() {
        const draftErrors = validateNewGuestDraft();

        if (Object.keys(draftErrors).length > 0) {
            setNewGuestErrors(draftErrors);
            return;
        }

        setNewGuestErrors({});
        const updatedNewGuests = [...newGuests, { ...newGuestDraft }];
        setNewGuests(updatedNewGuests);
        setData('new_guests', updatedNewGuests);
        setNewGuestDraft({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
        });
        setShowNewGuestForm(false);
    }

    function removeNewGuest(index: number) {
        const updatedNewGuests = newGuests.filter((_, i) => i !== index);
        setNewGuests(updatedNewGuests);
        setData('new_guests', updatedNewGuests);
    }

    function toggleRoom(roomId: number) {
        const updatedRoomIds = data.room_ids.includes(roomId)
            ? data.room_ids.filter((id) => id !== roomId)
            : [...data.room_ids, roomId];
        setData('room_ids', updatedRoomIds);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormErrors([]);

        if (isEditing) {
            put(update(booking.id).url, {
                preserveScroll: true,
                onSuccess: () => {
                    resetForm();
                    onOpenChange(false);
                    toast.success('Booking updated successfully.');
                },
                onError: (errors) => {
                    setFormErrors(Object.values(errors));
                },
            });
        } else {
            post(store().url, {
                preserveScroll: true,
                onSuccess: () => {
                    resetForm();
                    onOpenChange(false);
                    toast.success('Booking created successfully.');
                },
                onError: (errors) => {
                    setFormErrors(Object.values(errors));
                },
            });
        }
    }

    function resetForm() {
        reset();
        setSelectedGuests([]);
        setNewGuests([]);
        setGuestQuery('');
        setGuestResults([]);
        setShowNewGuestForm(false);
        setNewGuestDraft({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
        });
        setNewGuestErrors({});
        setFormErrors([]);
        setRoomQuery('');
        clearErrors();
    }

    function handleOpenChange(isOpen: boolean) {
        if (!isOpen) {
            resetForm();
        }
        onOpenChange(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Pencil className="size-5 text-muted-foreground" />
                                Edit Booking
                            </>
                        ) : (
                            <>
                                <CalendarPlus className="size-5 text-muted-foreground" />
                                New Booking
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the booking details below.'
                            : 'Create a new booking by selecting rooms, guests, and dates.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-col gap-0"
                >
                    <div className="flex flex-col gap-5 overflow-y-auto px-0.5 py-1">
                        {formErrors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertTitle>
                                    {isEditing
                                        ? 'Unable to update booking'
                                        : 'Unable to create booking'}
                                </AlertTitle>
                                <AlertDescription>
                                    <ul className="list-inside list-disc">
                                        {formErrors.map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="booking-start">Check-in</Label>
                                <DateTimePicker
                                    id="booking-start"
                                    value={data.start}
                                    onChange={(val) => setData('start', val)}
                                    placeholder="Select check-in"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="booking-end">Check-out</Label>
                                <DateTimePicker
                                    id="booking-end"
                                    value={data.end}
                                    onChange={(val) => setData('end', val)}
                                    placeholder="Select check-out"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="booking-status">Status</Label>
                            <Select
                                value={String(data.status)}
                                onValueChange={(val) =>
                                    setData('status', Number(val))
                                }
                            >
                                <SelectTrigger id="booking-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BOOKING_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={String(opt.value)}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Room Selection */}
                        <div className="grid gap-3">
                            <Label>
                                Rooms{' '}
                                <span className="text-muted-foreground">
                                    ({data.room_ids.length} selected)
                                </span>
                            </Label>

                            {data.room_ids.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {data.room_ids.map((roomId) => {
                                        const room = rooms.find(
                                            (r) => r.id === roomId,
                                        );
                                        if (!room) return null;
                                        return (
                                            <span
                                                key={roomId}
                                                className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
                                            >
                                                {room.room_category?.name}{' '}
                                                &ndash; {room.floor?.code}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRoom(roomId)
                                                    }
                                                    className="ml-0.5 rounded-sm hover:bg-muted"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter rooms..."
                                    value={roomQuery}
                                    onChange={(e) =>
                                        setRoomQuery(e.target.value)
                                    }
                                    className="pl-8"
                                />
                            </div>

                            <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                                <div className="flex flex-col gap-1.5">
                                    {filteredRooms.length > 0 ? (
                                        filteredRooms.map((room) => (
                                            <label
                                                key={room.id}
                                                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                                            >
                                                <Checkbox
                                                    checked={data.room_ids.includes(
                                                        room.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleRoom(room.id)
                                                    }
                                                />
                                                <span>
                                                    {room.room_category?.name}{' '}
                                                    &ndash; {room.floor?.code}
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                            No rooms match your filter.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Guest Section */}
                        <div className="grid gap-3">
                            <Label>Guests</Label>

                            {(selectedGuests.length > 0 ||
                                newGuests.length > 0) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedGuests.map((guest) => (
                                        <span
                                            key={guest.id}
                                            className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
                                        >
                                            {guest.first_name} {guest.last_name}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeExistingGuest(
                                                        guest.id,
                                                    )
                                                }
                                                className="ml-0.5 rounded-sm hover:bg-muted"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {newGuests.map((guest, idx) => (
                                        <span
                                            key={`new-${idx}`}
                                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs"
                                        >
                                            {guest.first_name} {guest.last_name}
                                            <span className="text-emerald-500">
                                                (new)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewGuest(idx)
                                                }
                                                className="ml-0.5 rounded-sm hover:bg-muted"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Guest search */}
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search existing guests..."
                                    value={guestQuery}
                                    onChange={(e) =>
                                        handleGuestQueryChange(e.target.value)
                                    }
                                    className="pl-8"
                                />
                                {isSearching && (
                                    <span className="absolute top-2.5 right-2.5 text-xs text-muted-foreground">
                                        Searching...
                                    </span>
                                )}
                            </div>

                            {guestResults.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-md border bg-popover p-1">
                                    {guestResults.map((guest) => (
                                        <button
                                            key={guest.id}
                                            type="button"
                                            onClick={() =>
                                                selectExistingGuest(guest)
                                            }
                                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                        >
                                            <span className="font-medium">
                                                {guest.first_name}{' '}
                                                {guest.last_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {guest.email}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* New guest inline form */}
                            {showNewGuestForm ? (
                                <div className="flex flex-col gap-2.5 rounded-md border bg-muted/30 p-3">
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <UserPlus className="size-3.5" />
                                        New guest details
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1">
                                            <Input
                                                placeholder="First name"
                                                value={newGuestDraft.first_name}
                                                onChange={(e) =>
                                                    setNewGuestDraft(
                                                        (prev) => ({
                                                            ...prev,
                                                            first_name:
                                                                e.target.value,
                                                        }),
                                                    )
                                                }
                                                aria-invalid={
                                                    !!newGuestErrors.first_name
                                                }
                                            />
                                            <InputError
                                                message={
                                                    newGuestErrors.first_name
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Input
                                                placeholder="Last name"
                                                value={newGuestDraft.last_name}
                                                onChange={(e) =>
                                                    setNewGuestDraft(
                                                        (prev) => ({
                                                            ...prev,
                                                            last_name:
                                                                e.target.value,
                                                        }),
                                                    )
                                                }
                                                aria-invalid={
                                                    !!newGuestErrors.last_name
                                                }
                                            />
                                            <InputError
                                                message={
                                                    newGuestErrors.last_name
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-1">
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={newGuestDraft.email}
                                            onChange={(e) =>
                                                setNewGuestDraft((prev) => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }))
                                            }
                                            aria-invalid={
                                                !!newGuestErrors.email
                                            }
                                        />
                                        <InputError
                                            message={newGuestErrors.email}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Input
                                            type="tel"
                                            placeholder="Phone (optional)"
                                            value={newGuestDraft.phone}
                                            onChange={(e) =>
                                                setNewGuestDraft((prev) => ({
                                                    ...prev,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            aria-invalid={
                                                !!newGuestErrors.phone
                                            }
                                        />
                                        <InputError
                                            message={newGuestErrors.phone}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addNewGuest}
                                        >
                                            <Plus className="size-3.5" />
                                            Add Guest
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowNewGuestForm(false);
                                                setNewGuestDraft({
                                                    first_name: '',
                                                    last_name: '',
                                                    email: '',
                                                    phone: '',
                                                });
                                                setNewGuestErrors({});
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-fit"
                                    onClick={() => setShowNewGuestForm(true)}
                                >
                                    <UserPlus className="size-3.5" />
                                    Add new guest
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit || processing}
                        >
                            {isEditing
                                ? processing
                                    ? 'Updating...'
                                    : 'Update Booking'
                                : processing
                                  ? 'Creating...'
                                  : 'Create Booking'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
