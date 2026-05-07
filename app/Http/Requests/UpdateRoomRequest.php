<?php

namespace App\Http\Requests;

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
        ];
    }
}
