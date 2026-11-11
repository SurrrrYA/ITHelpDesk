<?php

namespace App\Mail;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketStatusChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public string $oldStatus,
        public string $newStatus,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Status tiket '.$this->ticket->ticket_number.' menjadi '.TicketStatus::from($this->newStatus)->label(),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.tickets.status',
            with: [
                'ticket' => $this->ticket,
                'oldStatusLabel' => TicketStatus::from($this->oldStatus)->label(),
                'newStatusLabel' => TicketStatus::from($this->newStatus)->label(),
                'url' => rtrim((string) config('app.frontend_url'), '/').'/tickets/'.$this->ticket->id,
            ],
        );
    }
}
