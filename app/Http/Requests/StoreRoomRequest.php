<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'room_category_id' => ['required', 'integer', 'exists:room_categories,id'],
            'floor_id' => ['required', 'integer', 'exists:floors,id'],
            'manual_status' => ['nullable', 'integer', Rule::in(array_column(BookingStatus::cases(), 'value'))],
        ];
    }
}
