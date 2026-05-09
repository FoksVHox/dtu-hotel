<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingRoomsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hotel_id !== null;
    }

    public function rules(): array
    {
        return [
            'rules' => ['required', 'array', 'min:1', 'max:10'],
            'rules.*.start_number' => ['required', 'integer', 'min:1'],
            'rules.*.end_number' => ['required', 'integer', 'gte:rules.*.start_number'],
            'rules.*.floor_id' => ['required', 'integer', 'exists:floors,id'],
            'rules.*.category_id' => ['required', 'integer', 'exists:room_categories,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $rules = $this->input('rules', []);

            foreach ($rules as $index => $rule) {
                $start = (int) ($rule['start_number'] ?? 0);
                $end = (int) ($rule['end_number'] ?? 0);

                if ($end - $start + 1 > 50) {
                    $validator->errors()->add(
                        "rules.{$index}.end_number",
                        'Each rule may create at most 50 rooms.'
                    );
                }
            }
        });
    }
}
