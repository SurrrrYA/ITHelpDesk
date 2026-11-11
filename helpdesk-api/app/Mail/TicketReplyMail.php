<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketReplyMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Ticket $ticket, public TicketReply $reply) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Balasan baru pada '.$this->ticket->ticket_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.tickets.reply',
            with: [
                'ticket' => $this->ticket,
                'reply' => $this->reply,
                'url' => rtrim((string) config('app.frontend_url'), '/').'/tickets/'.$this->ticket->id,
            ],
        );
    }
}
