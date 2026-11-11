<?php

namespace App\Console\Commands;

use App\Enums\TicketStatus;
use App\Events\TicketStatusChanged;
use App\Mail\TicketStatusChangedMail;
use App\Models\Ticket;
use App\Models\TicketActivity;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Mail;

class AutoCloseResolvedTickets extends Command
{
    protected $signature = 'tickets:auto-close {--days=3 : Jumlah hari tanpa respons karyawan}';

    protected $description = 'Tutup otomatis tiket resolved yang tidak mendapat respons karyawan setelah beberapa hari.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $tickets = Ticket::query()
            ->with(['requester', 'assignee'])
            ->where('status', TicketStatus::Resolved->value)
            ->whereNotNull('resolved_at')
            ->where('resolved_at', '<=', $cutoff)
            ->whereDoesntHave('replies', function (Builder $query) {
                $query->where('is_internal', false)
                    ->whereColumn('ticket_replies.user_id', 'tickets.requester_id')
                    ->whereColumn('ticket_replies.created_at', '>', 'tickets.resolved_at');
            })
            ->get();

        $closed = 0;

        foreach ($tickets as $ticket) {
            $oldStatus = $ticket->status->value;

            $ticket->status = TicketStatus::Closed;
            $ticket->closed_at = now();
            $ticket->save();

            $ticket->activities()->create([
                'user_id' => null,
                'action' => TicketActivity::ACTION_AUTO_CLOSED,
                'properties' => [
                    'status' => ['old' => $oldStatus, 'new' => TicketStatus::Closed->value],
                    'reason' => "Tidak ada respons karyawan selama {$days} hari setelah tiket diselesaikan.",
                ],
            ]);

            TicketStatusChanged::dispatch(
                $ticket,
                $oldStatus,
                TicketStatus::Closed->value,
                'Ditutup otomatis karena tidak ada respons karyawan.',
            );

            if ($ticket->requester !== null) {
                Mail::to($ticket->requester->email)->queue(
                    new TicketStatusChangedMail($ticket, $oldStatus, TicketStatus::Closed->value),
                );
            }

            $closed++;
        }

        $this->info("Tiket ditutup otomatis: {$closed}.");

        return self::SUCCESS;
    }
}
