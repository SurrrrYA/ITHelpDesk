<?php

namespace App\Http\Resources;

use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Asset
 */
class AssetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'asset_tag' => $this->asset_tag,
            'name' => $this->name,
            'category' => $this->category,
            'brand' => $this->brand,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'purchased_at' => $this->purchased_at?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'assigned_to' => new UserResource($this->whenLoaded('assignedUser')),
            'tickets_count' => $this->whenCounted('tickets'),
            'tickets' => AssetTicketResource::collection($this->whenLoaded('tickets')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
