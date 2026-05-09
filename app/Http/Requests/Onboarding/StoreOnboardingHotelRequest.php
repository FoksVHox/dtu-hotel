<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hotel_id === null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:64'],
            'cvr' => ['required', 'string', 'max:64'],
            'address' => ['required', 'string', 'max:512'],
            'currency' => ['required', 'string', 'in:DKK,EUR,USD'],
        ];
    }
}
