<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingBuildingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hotel_id !== null;
    }

    public function rules(): array
    {
        return [
            'buildings' => ['required', 'array', 'min:1', 'max:10'],
            'buildings.*.name' => ['required', 'string', 'max:255'],
            'buildings.*.floors_count' => ['required', 'integer', 'between:1,20'],
        ];
    }
}
