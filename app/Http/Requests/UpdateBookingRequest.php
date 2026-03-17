<?php

namespace App\Http\Requests;

class UpdateBookingRequest extends BookingFormRequest
{
    protected function excludedBookingId(): ?int
    {
        return $this->route('booking')->id;
    }
}
