<?php

namespace App\Events;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public string $oldStatus,
        public string $newStatus,
        public ?string $note = null,
    ) {
        $this->ticket->loadMissing(['requester', 'assignee']);
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('queue'),
            new PrivateChannel('ticket.'.$this->ticket->id),
        ];

        if ($this->ticket->requester_id !== null) {
            $channels[] = new PrivateChannel('user.'.$this->ticket->requester_id);
        }

        if ($this->ticket->assignee_id !== null) {
            $channels[] = new PrivateChannel('user.'.$this->ticket->assignee_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'status.changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message' => $this->ticket->ticket_number.' berubah menjadi '.TicketStatus::from($this->newStatus)->label(),
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject' => $this->ticket->subject,
            'old_status' => $this->oldStatus,
            'old_status_label' => TicketStatus::from($this->oldStatus)->label(),
            'new_status' => $this->newStatus,
            'new_status_label' => TicketStatus::from($this->newStatus)->label(),
            'assignee_name' => $this->ticket->assignee?->name,
            'note' => $this->note,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
