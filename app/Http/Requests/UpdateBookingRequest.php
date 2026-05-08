<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Validator;

class UpdateBookingRequest extends StoreBookingRequest
{
    protected function excludedBookingId(): ?int
    {
        return $this->route('booking')->id;
    }

    /**
     * Updates support partial payloads (e.g. status-only transitions for
     * housekeeping). Only `status` is required; the rest fall back to
     * `sometimes` so absent fields don't trigger validation errors.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        $rules['room_ids'] = ['sometimes', 'array', 'min:1'];
        $rules['start'] = ['sometimes', 'date'];
        $rules['end'] = ['sometimes', 'date', 'after:start'];

        return $rules;
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->hasAny(['guest_ids', 'new_guests'])) {
                    $this->validateGuestsPresent($validator);
                }

                $this->validatePartialDateOrder($validator);

                if ($this->hasAny(['room_ids', 'start', 'end'])) {
                    $this->validateRoomAvailability($validator);
                }
            },
        ];
    }

    /**
     * Validate date order when only one of start/end is sent — the
     * `after:start` rule on the `end` field only fires when both are
     * present, so a one-sided change can otherwise corrupt the booking.
     */
    private function validatePartialDateOrder(Validator $validator): void
    {
        $hasStart = $this->has('start');
        $hasEnd = $this->has('end');

        if ($hasStart === $hasEnd) {
            return;
        }

        $booking = $this->route('booking');
        $start = $hasStart ? $this->input('start') : $booking->start;
        $end = $hasEnd ? $this->input('end') : $booking->end;

        try {
            $startAt = Carbon::parse($start);
            $endAt = Carbon::parse($end);
        } catch (\Throwable) {
            return;
        }

        if ($endAt->lessThanOrEqualTo($startAt)) {
            $field = $hasStart ? 'start' : 'end';
            $validator->errors()->add(
                $field,
                'Check-out date must be after check-in date.',
            );
        }
    }
}
