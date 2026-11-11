<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TicketReplyCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreReplyRequest;
use App\Http\Resources\TicketReplyResource;
use App\Mail\TicketReplyMail;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;

class TicketReplyController extends Controller
{
    public function __construct(private readonly TicketService $service) {}

    public function index(Request $request, Ticket $ticket)
    {
        Gate::authorize('view', $ticket);

        $query = $ticket->replies()->with(['user', 'attachments'])->oldest();

        if (! $request->user()->canHandleTickets()) {
            $query->where('is_internal', false);
        }

        return TicketReplyResource::collection($query->paginate(50));
    }

    public function store(StoreReplyRequest $request, Ticket $ticket): JsonResponse
    {
        $isInternal = $request->boolean('is_internal');

        if ($isInternal && ! $request->user()->canHandleTickets()) {
            abort(403, 'Hanya teknisi atau admin yang dapat menulis catatan internal.');
        }

        $reply = $this->service->addReply(
            $ticket,
            $request->user(),
            $request->string('body')->toString(),
            $isInternal,
            $request->file('attachments', []),
        );

        $reply->load(['user', 'attachments']);

        $ticket->loadMissing(['requester', 'assignee']);

        TicketReplyCreated::dispatch($ticket, $reply);

        if (! $isInternal) {
            $this->notifyParticipants($ticket, $reply, $request->user()->id);
        }

        return TicketReplyResource::make($reply)->response()->setStatusCode(201);
    }

    private function notifyParticipants(Ticket $ticket, TicketReply $reply, int $actorId): void
    {
        $recipients = collect([$ticket->requester, $ticket->assignee])
            ->filter()
            ->unique('id')
            ->reject(fn ($user) => $user->id === $actorId);

        $recipients->each(function ($user) use ($ticket, $reply) {
            Mail::to($user->email)->queue(new TicketReplyMail($ticket, $reply));
        });
    }
}
