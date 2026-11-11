<?php

namespace App\Services;

use App\Enums\TicketStatus;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketAttachment;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TicketService
{
    public function __construct(private readonly TicketNumberService $numbers) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, UploadedFile>  $attachments
     */
    public function create(User $actor, array $data, array $attachments = []): Ticket
    {
        return DB::transaction(function () use ($actor, $data, $attachments) {
            $ticket = new Ticket($data);
            $ticket->requester_id = $actor->id;
            $ticket->status = TicketStatus::New;
            $ticket->ticket_number = $this->numbers->next();

            $policy = SlaPolicy::forPriority($ticket->priority);

            if ($policy) {
                $ticket->sla_response_due_at = now()->addMinutes($policy->response_minutes);
                $ticket->sla_resolution_due_at = now()->addMinutes($policy->resolution_minutes);
            }

            $ticket->save();

            $this->record($ticket, $actor, TicketActivity::ACTION_CREATED, [
                'status' => ['old' => null, 'new' => $ticket->status->value],
            ]);

            if ($attachments !== []) {
                $this->attach($ticket, $actor, $attachments);
            }

            return $ticket->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Ticket $ticket, User $actor, array $data): Ticket
    {
        return DB::transaction(function () use ($ticket, $actor, $data) {
            $oldPriority = $ticket->priority->value;

            $ticket->fill($data)->save();

            if (array_key_exists('priority', $data) && $ticket->priority->value !== $oldPriority) {
                $this->record($ticket, $actor, TicketActivity::ACTION_PRIORITY_CHANGED, [
                    'priority' => ['old' => $oldPriority, 'new' => $ticket->priority->value],
                ]);
            }

            return $ticket->refresh();
        });
    }

    public function assign(Ticket $ticket, User $actor, User $assignee): Ticket
    {
        return DB::transaction(function () use ($ticket, $actor, $assignee) {
            $oldAssignee = $ticket->assignee_id;
            $oldStatus = $ticket->status;

            $ticket->assignee_id = $assignee->id;

            if ($ticket->status === TicketStatus::New) {
                $ticket->status = TicketStatus::Assigned;
            }

            $ticket->save();

            $this->record($ticket, $actor, TicketActivity::ACTION_ASSIGNED, [
                'assignee' => ['old' => $oldAssignee, 'new' => $assignee->id],
                'status' => ['old' => $oldStatus->value, 'new' => $ticket->status->value],
            ]);

            return $ticket->refresh();
        });
    }

    public function take(Ticket $ticket, User $actor): Ticket
    {
        return DB::transaction(function () use ($ticket, $actor) {
            $oldStatus = $ticket->status;

            $ticket->assignee_id = $actor->id;
            $ticket->status = TicketStatus::Assigned;
            $ticket->save();

            $this->record($ticket, $actor, TicketActivity::ACTION_TAKEN, [
                'assignee' => ['old' => null, 'new' => $actor->id],
                'status' => ['old' => $oldStatus->value, 'new' => $ticket->status->value],
            ]);

            return $ticket->refresh();
        });
    }

    public function changeStatus(Ticket $ticket, User $actor, TicketStatus $target, ?string $note = null): Ticket
    {
        return DB::transaction(function () use ($ticket, $actor, $target, $note) {
            $oldStatus = $ticket->status;

            $ticket->status = $target;

            if ($target === TicketStatus::Resolved) {
                $ticket->resolved_at = now();
            }

            if ($target === TicketStatus::Closed) {
                $ticket->closed_at = now();
                $ticket->resolved_at ??= now();
            }

            if ($target === TicketStatus::InProgress && $oldStatus === TicketStatus::Resolved) {
                $ticket->resolved_at = null;
            }

            $ticket->save();

            $this->record($ticket, $actor, TicketActivity::ACTION_STATUS_CHANGED, [
                'status' => ['old' => $oldStatus->value, 'new' => $target->value],
                'note' => $note,
            ]);

            return $ticket->refresh();
        });
    }

    /**
     * @param  array<int, UploadedFile>  $attachments
     */
    public function addReply(
        Ticket $ticket,
        User $actor,
        string $body,
        bool $isInternal = false,
        array $attachments = [],
    ): TicketReply {
        return DB::transaction(function () use ($ticket, $actor, $body, $isInternal, $attachments) {
            $reply = $ticket->replies()->create([
                'user_id' => $actor->id,
                'body' => $body,
                'is_internal' => $isInternal,
            ]);

            if ($attachments !== []) {
                $this->attach($ticket, $actor, $attachments, $reply);
            }

            if (! $isInternal && $actor->canHandleTickets() && $ticket->first_response_at === null) {
                $ticket->forceFill(['first_response_at' => now()])->save();
            }

            $this->record(
                $ticket,
                $actor,
                $isInternal ? TicketActivity::ACTION_INTERNAL_NOTE : TicketActivity::ACTION_REPLIED,
                ['reply_id' => $reply->id],
            );

            return $reply->refresh();
        });
    }

    /**
     * @param  array<int, UploadedFile>  $attachments
     */
    public function attach(
        Ticket $ticket,
        User $actor,
        array $attachments,
        ?TicketReply $reply = null,
    ): array {
        $created = [];

        foreach ($attachments as $file) {
            $extension = $file->getClientOriginalExtension() ?: $file->extension();
            $storedName = Str::uuid()->toString().'.'.$extension;
            $path = $file->storeAs('tickets/'.$ticket->id, $storedName, 'local');

            $created[] = TicketAttachment::query()->create([
                'ticket_id' => $ticket->id,
                'ticket_reply_id' => $reply?->id,
                'user_id' => $actor->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'file_size' => $file->getSize(),
            ]);
        }

        $this->record($ticket, $actor, TicketActivity::ACTION_ATTACHMENT_ADDED, [
            'count' => count($attachments),
            'reply_id' => $reply?->id,
        ]);

        return $created;
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    public function record(Ticket $ticket, ?User $actor, string $action, array $properties = []): TicketActivity
    {
        return $ticket->activities()->create([
            'user_id' => $actor?->id,
            'action' => $action,
            'properties' => $properties,
        ]);
    }

    public function deleteAttachment(TicketAttachment $attachment): void
    {
        Storage::disk('local')->delete($attachment->file_path);
        $attachment->delete();
    }
}
