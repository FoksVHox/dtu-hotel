<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', 'integer', Rule::in(array_column(RoomStatus::cases(), 'value'))],
            'scheduled_cleaning_at' => ['nullable', 'date'],
            'room_category_id' => ['nullable', 'integer', 'exists:room_categories,id'],
            'floor_id' => ['nullable', 'integer', 'exists:floors,id'],
            'manual_status' => ['nullable', 'integer', Rule::in(array_column(BookingStatus::cases(), 'value'))],
            'code' => ['nullable', 'string', 'max:20'],
        ];
    }
}
