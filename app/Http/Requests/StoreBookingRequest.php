<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBookingRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'room_ids' => ['required', 'array', 'min:1'],
            'room_ids.*' => ['required', 'integer', Rule::exists('rooms', 'id')],

            'guest_ids' => ['nullable', 'array'],
            'guest_ids.*' => ['required', 'integer', Rule::exists('guests', 'id')],

            'new_guests' => ['nullable', 'array'],
            'new_guests.*.first_name' => ['required_with:new_guests', 'string', 'max:255'],
            'new_guests.*.last_name' => ['required_with:new_guests', 'string', 'max:255'],
            'new_guests.*.email' => ['required_with:new_guests', 'string', 'email', 'max:255'],
            'new_guests.*.phone' => ['nullable', 'string', 'max:255'],

            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
            'status' => ['required', 'integer', Rule::in(array_column(BookingStatus::cases(), 'value'))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'room_ids.required' => 'At least one room must be selected.',
            'room_ids.min' => 'At least one room must be selected.',
            'end.after' => 'Check-out date must be after check-in date.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validateGuestsPresent($validator);
                $this->validateRoomAvailability($validator);
            },
        ];
    }

    private function validateGuestsPresent(Validator $validator): void
    {
        $guestIds = $this->input('guest_ids', []);
        $newGuests = $this->input('new_guests', []);

        if (count($guestIds) === 0 && count($newGuests) === 0) {
            $validator->errors()->add('guests', 'At least one guest is required.');
        }
    }

    private function validateRoomAvailability(Validator $validator): void
    {
        $roomIds = $this->input('room_ids', []);
        $start = $this->input('start');
        $end = $this->input('end');

        if (empty($roomIds) || ! $start || ! $end) {
            return;
        }

        $maintenanceConflict = Booking::query()
            ->where('status', BookingStatus::Maintenance)
            ->where('start', '<', $end)
            ->where('end', '>', $start)
            ->whereHas('rooms', fn ($q) => $q->whereIn('rooms.id', $roomIds))
            ->exists();

        if ($maintenanceConflict) {
            $validator->errors()->add(
                'room_ids',
                'One or more selected rooms are under maintenance during the requested dates.',
            );

            return;
        }

        $overlapConflict = Booking::query()
            ->where('status', '!=', BookingStatus::Cancelled)
            ->where('start', '<', $end)
            ->where('end', '>', $start)
            ->whereHas('rooms', fn ($q) => $q->whereIn('rooms.id', $roomIds))
            ->exists();

        if ($overlapConflict) {
            $validator->errors()->add(
                'room_ids',
                'One or more selected rooms already have a booking during the requested dates.',
            );
        }
    }
}
