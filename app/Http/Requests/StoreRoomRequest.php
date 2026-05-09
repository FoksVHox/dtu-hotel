<?php

namespace App\Http\Requests;

use App\Enums\RoomStatus;
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
            'code' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'integer', Rule::in(array_column(RoomStatus::cases(), 'value'))],
        ];
    }
}
