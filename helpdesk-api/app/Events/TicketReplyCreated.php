<?php

namespace App\Events;

use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketReplyCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Ticket $ticket, public TicketReply $reply)
    {
        $this->ticket->loadMissing(['requester', 'assignee']);
        $this->reply->loadMissing('user');
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('ticket.'.$this->ticket->id)];

        if ($this->reply->is_internal) {
            $channels[] = new PrivateChannel('queue');

            return $channels;
        }

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
        return 'reply.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message' => $this->reply->is_internal
                ? 'Catatan internal baru pada '.$this->ticket->ticket_number
                : 'Balasan baru pada '.$this->ticket->ticket_number,
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject' => $this->ticket->subject,
            'reply_id' => $this->reply->id,
            'is_internal' => $this->reply->is_internal,
            'user_name' => $this->reply->user?->name,
            'user_role' => $this->reply->user?->role->value,
            'body' => $this->reply->body,
            'created_at' => $this->reply->created_at?->toIso8601String(),
        ];
    }
}
