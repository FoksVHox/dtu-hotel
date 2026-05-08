<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Validator;

class UpdateBookingRequest extends BookingFormRequest
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

                if ($this->hasAny(['room_ids', 'start', 'end'])) {
                    $this->validateRoomAvailability($validator);
                }
            },
        ];
    }
}
