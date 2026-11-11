<?php

namespace App\Http\Resources;

use App\Models\TicketActivity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TicketActivity
 */
class TicketActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'action_label' => $this->label(),
            'properties' => $this->properties ?? [],
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function label(): string
    {
        return match ($this->action) {
            TicketActivity::ACTION_CREATED => 'Tiket dibuat',
            TicketActivity::ACTION_STATUS_CHANGED => 'Status diubah',
            TicketActivity::ACTION_ASSIGNED => 'Teknisi ditugaskan',
            TicketActivity::ACTION_TAKEN => 'Tiket diambil teknisi',
            TicketActivity::ACTION_REPLIED => 'Balasan ditambahkan',
            TicketActivity::ACTION_INTERNAL_NOTE => 'Catatan internal ditambahkan',
            TicketActivity::ACTION_PRIORITY_CHANGED => 'Prioritas diubah',
            TicketActivity::ACTION_ATTACHMENT_ADDED => 'Lampiran ditambahkan',
            TicketActivity::ACTION_REOPENED => 'Tiket dibuka kembali',
            TicketActivity::ACTION_CLOSED => 'Tiket ditutup',
            TicketActivity::ACTION_AUTO_CLOSED => 'Tiket ditutup otomatis',
            TicketActivity::ACTION_SLA_REMINDER_SENT => 'Pengingat SLA dikirim',
            default => $this->action,
        };
    }
}
