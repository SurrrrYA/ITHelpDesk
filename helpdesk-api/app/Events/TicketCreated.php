<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Ticket $ticket)
    {
        $this->ticket->loadMissing(['requester', 'category']);
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('queue'),
            new PrivateChannel('user.'.$this->ticket->requester_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ticket.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message' => 'Tiket baru: '.$this->ticket->ticket_number,
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject' => $this->ticket->subject,
            'status' => $this->ticket->status->value,
            'status_label' => $this->ticket->status->label(),
            'priority' => $this->ticket->priority->value,
            'priority_label' => $this->ticket->priority->label(),
            'requester_name' => $this->ticket->requester?->name,
            'category_name' => $this->ticket->category?->name,
            'created_at' => $this->ticket->created_at?->toIso8601String(),
        ];
    }
}
