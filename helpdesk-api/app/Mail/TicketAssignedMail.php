<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketAssignedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Ticket $ticket) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tiket '.$this->ticket->ticket_number.' ditugaskan kepada Anda',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.tickets.assigned',
            with: [
                'ticket' => $this->ticket,
                'url' => rtrim((string) config('app.frontend_url'), '/').'/tickets/'.$this->ticket->id,
            ],
        );
    }
}
