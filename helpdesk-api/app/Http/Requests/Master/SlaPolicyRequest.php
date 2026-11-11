<?php

namespace App\Http\Requests\Master;

use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SlaPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $policyId = $this->route('slaPolicy')?->id;

        return [
            'name' => ['required', 'string', 'max:100'],
            'priority' => [
                'required',
                Rule::enum(TicketPriority::class),
                Rule::unique('sla_policies', 'priority')->ignore($policyId),
            ],
            'response_minutes' => ['required', 'integer', 'min:1', 'max:525600'],
            'resolution_minutes' => [
                'required',
                'integer',
                'min:1',
                'max:525600',
                'gte:response_minutes',
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resolution_minutes.gte' => 'Batas penyelesaian tidak boleh lebih cepat dari batas respons.',
        ];
    }
}
