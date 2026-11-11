<?php

namespace App\Console\Commands;

use App\Enums\TicketStatus;
use App\Mail\SlaReminderMail;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendSlaReminders extends Command
{
    protected $signature = 'tickets:sla-reminders {--minutes=60 : Jendela waktu sebelum batas SLA}';

    protected $description = 'Kirim email pengingat untuk tiket yang mendekati atau melewati batas SLA penyelesaian.';

    public function handle(): int
    {
        $window = max(1, (int) $this->option('minutes'));

        $tickets = Ticket::query()
            ->with(['assignee', 'requester'])
            ->whereIn('status', [
                TicketStatus::New->value,
                TicketStatus::Assigned->value,
                TicketStatus::InProgress->value,
            ])
            ->whereNotNull('sla_resolution_due_at')
            ->whereNull('sla_reminder_sent_at')
            ->where('sla_resolution_due_at', '<=', now()->addMinutes($window))
            ->orderBy('sla_resolution_due_at')
            ->get();

        $sent = 0;

        foreach ($tickets as $ticket) {
            $recipients = $ticket->assignee
                ? collect([$ticket->assignee])
                : User::query()
                    ->whereIn('role', ['technician', 'admin'])
                    ->where('is_active', true)
                    ->get();

            if ($recipients->isEmpty()) {
                continue;
            }

            foreach ($recipients as $recipient) {
                Mail::to($recipient->email)->queue(new SlaReminderMail($ticket));
            }

            $ticket->forceFill(['sla_reminder_sent_at' => now()])->save();

            $ticket->activities()->create([
                'user_id' => null,
                'action' => TicketActivity::ACTION_SLA_REMINDER_SENT,
                'properties' => [
                    'recipients' => $recipients->pluck('email')->all(),
                    'sla_resolution_due_at' => $ticket->sla_resolution_due_at?->toIso8601String(),
                ],
            ]);

            $sent++;
        }

        $this->info("Pengingat SLA diproses untuk {$sent} tiket.");

        return self::SUCCESS;
    }
}
