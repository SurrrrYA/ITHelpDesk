<?php

namespace App\Http\Resources;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * @mixin Ticket
 */
class TicketResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'description' => $this->description,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'priority' => $this->priority->value,
            'priority_label' => $this->priority->label(),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'asset' => new AssetResource($this->whenLoaded('asset')),
            'sla_response_due_at' => $this->sla_response_due_at?->toIso8601String(),
            'sla_resolution_due_at' => $this->sla_resolution_due_at?->toIso8601String(),
            'first_response_at' => $this->first_response_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'is_response_overdue' => $this->isResponseOverdue(),
            'is_resolution_overdue' => $this->isResolutionOverdue(),
            'replies_count' => $this->whenCounted('replies'),
            'attachments_count' => $this->whenCounted('attachments'),
            'attachments' => TicketAttachmentResource::collection($this->whenLoaded('attachments')),
            'allowed_transitions' => array_map(
                fn ($status) => ['value' => $status->value, 'label' => $status->label()],
                $this->status->allowedTransitions(),
            ),
            'can' => [
                'update' => $user ? Gate::allows('update', $this->resource) : false,
                'assign' => $user ? Gate::allows('assign', $this->resource) : false,
                'take' => $user ? Gate::allows('take', $this->resource) : false,
                'change_status' => $user ? Gate::allows('changeStatus', $this->resource) : false,
                'reply' => $user ? Gate::allows('reply', $this->resource) : false,
                'add_attachment' => $user ? Gate::allows('addAttachment', $this->resource) : false,
            ],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
