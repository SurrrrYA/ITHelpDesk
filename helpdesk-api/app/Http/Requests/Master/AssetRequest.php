<?php

namespace App\Http\Requests\Master;

use App\Models\Asset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssetRequest extends FormRequest
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
        $assetId = $this->route('asset')?->id;

        return [
            'asset_tag' => [
                'required',
                'string',
                'max:50',
                Rule::unique('assets', 'asset_tag')->ignore($assetId),
            ],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'purchased_at' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'status' => [
                'required',
                Rule::in([Asset::STATUS_ACTIVE, Asset::STATUS_MAINTENANCE, Asset::STATUS_RETIRED]),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
