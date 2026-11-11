<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TicketStatus;
use App\Events\TicketCreated;
use App\Events\TicketStatusChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\AssignTicketRequest;
use App\Http\Requests\Ticket\ChangeStatusRequest;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Requests\Ticket\UpdateTicketRequest;
use App\Http\Resources\TicketActivityResource;
use App\Http\Resources\TicketResource;
use App\Mail\TicketAssignedMail;
use App\Mail\TicketCreatedMail;
use App\Mail\TicketStatusChangedMail;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketAttachment;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    public function __construct(private readonly TicketService $service) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Ticket::query()
            ->with(['category', 'requester', 'assignee', 'asset'])
            ->withCount(['replies', 'attachments']);

        if ($user->isEmployee()) {
            $query->where('requester_id', $user->id);
        } elseif ($user->isTechnician()) {
            $query->where(function (Builder $q) use ($user) {
                $q->where('assignee_id', $user->id)
                    ->orWhere(function (Builder $queue) {
                        $queue->whereNull('assignee_id')
                            ->where('status', TicketStatus::New->value);
                    });
            });
        }

        $this->applyFilters($request, $query, $user);

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        $tickets = $query->latest()->paginate($perPage)->withQueryString();

        return TicketResource::collection($tickets);
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = $this->service->create(
            $request->user(),
            $request->safe()->except('attachments'),
            $request->file('attachments', []),
        );

        $ticket->loadMissing(['requester', 'assignee', 'category']);

        TicketCreated::dispatch($ticket);

        if ($ticket->requester !== null) {
            Mail::to($ticket->requester->email)->queue(new TicketCreatedMail($ticket));
        }

        return $this->respond($ticket, 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        Gate::authorize('view', $ticket);

        return $this->respond($ticket);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        if ($request->user()->isEmployee() && $request->has('priority')) {
            throw ValidationException::withMessages([
                'priority' => ['Hanya teknisi atau admin yang dapat mengubah prioritas.'],
            ]);
        }

        $ticket = $this->service->update($ticket, $request->user(), $request->validated());

        return $this->respond($ticket);
    }

    public function assign(AssignTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $oldStatus = $ticket->status->value;
        $assignee = User::query()->findOrFail($request->integer('assignee_id'));
        $ticket = $this->service->assign($ticket, $request->user(), $assignee);
        $ticket->loadMissing(['requester', 'assignee']);

        TicketStatusChanged::dispatch($ticket, $oldStatus, $ticket->status->value);

        Mail::to($assignee->email)->queue(new TicketAssignedMail($ticket));

        return $this->respond($ticket);
    }

    public function take(Request $request, Ticket $ticket): JsonResponse
    {
        Gate::authorize('take', $ticket);

        $oldStatus = $ticket->status->value;
        $ticket = $this->service->take($ticket, $request->user());
        $ticket->loadMissing(['requester', 'assignee']);

        TicketStatusChanged::dispatch($ticket, $oldStatus, $ticket->status->value);

        return $this->respond($ticket);
    }

    public function changeStatus(ChangeStatusRequest $request, Ticket $ticket): JsonResponse
    {
        $target = TicketStatus::from($request->string('status')->toString());

        if (! $ticket->status->canTransitionTo($target)) {
            throw ValidationException::withMessages([
                'status' => ['Perubahan status dari '.$ticket->status->label().' ke '.$target->label().' tidak diizinkan.'],
            ]);
        }

        if ($request->user()->isEmployee()
            && ($ticket->status !== TicketStatus::Resolved
                || ! in_array($target, [TicketStatus::Closed, TicketStatus::InProgress], true))) {
            throw ValidationException::withMessages([
                'status' => ['Karyawan hanya dapat menutup atau membuka kembali tiket yang sudah selesai.'],
            ]);
        }

        $oldStatus = $ticket->status->value;
        $ticket = $this->service->changeStatus(
            $ticket,
            $request->user(),
            $target,
            $request->input('note'),
        );
        $ticket->loadMissing(['requester', 'assignee']);

        TicketStatusChanged::dispatch($ticket, $oldStatus, $target->value, $request->input('note'));

        if ($ticket->requester !== null && $ticket->requester->id !== $request->user()->id) {
            Mail::to($ticket->requester->email)->queue(
                new TicketStatusChangedMail($ticket, $oldStatus, $target->value),
            );
        }

        return $this->respond($ticket);
    }

    public function activities(Request $request, Ticket $ticket)
    {
        Gate::authorize('view', $ticket);

        $query = $ticket->activities()->with('user')->latest();

        if (! $request->user()->canHandleTickets()) {
            $query->where('action', '!=', TicketActivity::ACTION_INTERNAL_NOTE);
        }

        return TicketActivityResource::collection($query->paginate(30));
    }

    public function downloadAttachment(TicketAttachment $attachment)
    {
        $ticket = $attachment->ticket ?? $attachment->reply?->ticket;

        abort_if($ticket === null, 404, 'Lampiran tidak ditemukan.');

        Gate::authorize('view', $ticket);

        if (! Storage::disk('local')->exists($attachment->file_path)) {
            abort(404, 'File tidak ditemukan di penyimpanan.');
        }

        return Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
    }

    private function respond(Ticket $ticket, int $status = 200): JsonResponse
    {
        $ticket->load(['category', 'requester', 'assignee', 'asset', 'attachments'])
            ->loadCount(['replies', 'attachments']);

        return TicketResource::make($ticket)->response()->setStatusCode($status);
    }

    private function applyFilters(Request $request, Builder $query, User $user): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->boolean('unassigned')) {
            $query->whereNull('assignee_id')->where('status', TicketStatus::New->value);
        }

        if ($request->boolean('assigned_to_me')) {
            $query->where('assignee_id', $user->id);
        }

        if ($user->isAdmin() && $request->filled('assignee_id')) {
            $query->where('assignee_id', $request->integer('assignee_id'));
        }

        if ($user->isAdmin() && $request->filled('requester_id')) {
            $query->where('requester_id', $request->integer('requester_id'));
        }

        if ($request->filled('q')) {
            $term = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $request->string('q')).'%';
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

            $query->where(function (Builder $search) use ($term, $operator) {
                $search->where('subject', $operator, $term)
                    ->orWhere('ticket_number', $operator, $term);
            });
        }
    }
}
