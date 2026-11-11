<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $base = $this->scopedQuery($user);

        $statusCounts = (clone $base)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $priorityCounts = (clone $base)
            ->select('priority', DB::raw('count(*) as total'))
            ->groupBy('priority')
            ->pluck('total', 'priority');

        $byStatus = collect(TicketStatus::cases())
            ->map(fn (TicketStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'count' => (int) ($statusCounts[$status->value] ?? 0),
            ])
            ->values();

        $byPriority = collect(TicketPriority::cases())
            ->map(fn (TicketPriority $priority) => [
                'value' => $priority->value,
                'label' => $priority->label(),
                'count' => (int) ($priorityCounts[$priority->value] ?? 0),
            ])
            ->values();

        $categoryNames = Category::query()->pluck('name', 'id');

        $byCategory = (clone $base)
            ->select('category_id', DB::raw('count(*) as total'))
            ->whereNotNull('category_id')
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->category_id,
                'name' => $categoryNames[$row->category_id] ?? 'Tanpa kategori',
                'count' => (int) $row->total,
            ])
            ->values();

        $openStatuses = [
            TicketStatus::New->value,
            TicketStatus::Assigned->value,
            TicketStatus::InProgress->value,
        ];

        $responseOverdue = (clone $base)
            ->whereNull('first_response_at')
            ->whereNotNull('sla_response_due_at')
            ->where('sla_response_due_at', '<', now())
            ->where('status', '!=', TicketStatus::Closed->value)
            ->count();

        $resolutionOverdue = (clone $base)
            ->whereNull('resolved_at')
            ->whereNotNull('sla_resolution_due_at')
            ->where('sla_resolution_due_at', '<', now())
            ->where('status', '!=', TicketStatus::Closed->value)
            ->count();

        $cards = [
            'total' => (int) $byStatus->sum('count'),
            'open' => (clone $base)->whereIn('status', $openStatuses)->count(),
            'resolved' => (int) ($statusCounts[TicketStatus::Resolved->value] ?? 0),
            'closed' => (int) ($statusCounts[TicketStatus::Closed->value] ?? 0),
            'unassigned' => (clone $base)
                ->whereNull('assignee_id')
                ->where('status', TicketStatus::New->value)
                ->count(),
            'overdue' => $responseOverdue + $resolutionOverdue,
        ];

        $responseTickets = (clone $base)
            ->whereNotNull('first_response_at')
            ->get(['created_at', 'first_response_at']);

        $resolutionTickets = (clone $base)
            ->whereNotNull('resolved_at')
            ->get(['created_at', 'resolved_at']);

        $avgResponse = $responseTickets->isEmpty()
            ? null
            : (int) round($responseTickets->avg(
                fn (Ticket $ticket) => abs($ticket->created_at->diffInMinutes($ticket->first_response_at)),
            ));

        $avgResolution = $resolutionTickets->isEmpty()
            ? null
            : (int) round($resolutionTickets->avg(
                fn (Ticket $ticket) => abs($ticket->created_at->diffInMinutes($ticket->resolved_at)),
            ));

        $start = now()->subDays(29)->startOfDay();

        $trendRows = (clone $base)
            ->where('created_at', '>=', $start)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day');

        $trend = collect(range(0, 29))
            ->map(function (int $offset) use ($start, $trendRows) {
                $date = $start->copy()->addDays($offset)->toDateString();

                return [
                    'date' => $date,
                    'count' => (int) ($trendRows[$date] ?? 0),
                ];
            })
            ->values();

        $attention = (clone $base)
            ->whereIn('status', $openStatuses)
            ->whereNotNull('sla_resolution_due_at')
            ->orderBy('sla_resolution_due_at')
            ->limit(5)
            ->get(['id', 'ticket_number', 'subject', 'status', 'priority', 'sla_resolution_due_at'])
            ->map(fn (Ticket $ticket) => [
                'id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
                'status' => $ticket->status->value,
                'status_label' => $ticket->status->label(),
                'priority' => $ticket->priority->value,
                'priority_label' => $ticket->priority->label(),
                'sla_resolution_due_at' => $ticket->sla_resolution_due_at?->toIso8601String(),
                'is_resolution_overdue' => $ticket->isResolutionOverdue(),
            ])
            ->values();

        return response()->json([
            'data' => [
                'scope' => $user->role->value,
                'cards' => $cards,
                'by_status' => $byStatus,
                'by_priority' => $byPriority,
                'by_category' => $byCategory,
                'workload' => $user->isAdmin() ? $this->workload() : [],
                'trend' => $trend,
                'sla' => [
                    'response_overdue' => $responseOverdue,
                    'resolution_overdue' => $resolutionOverdue,
                    'avg_response_minutes' => $avgResponse,
                    'avg_resolution_minutes' => $avgResolution,
                ],
                'attention' => $attention,
            ],
        ]);
    }

    private function scopedQuery(User $user): Builder
    {
        $query = Ticket::query();

        if ($user->isEmployee()) {
            $query->where('requester_id', $user->id);
        } elseif ($user->isTechnician()) {
            $query->where(function (Builder $scoped) use ($user) {
                $scoped->where('assignee_id', $user->id)
                    ->orWhere(function (Builder $queue) {
                        $queue->whereNull('assignee_id')
                            ->where('status', TicketStatus::New->value);
                    });
            });
        }

        return $query;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function workload(): Collection
    {
        $technicians = User::query()
            ->where('role', 'technician')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $ids = $technicians->pluck('id');

        $activeCounts = Ticket::query()
            ->whereIn('assignee_id', $ids)
            ->whereIn('status', [TicketStatus::Assigned->value, TicketStatus::InProgress->value])
            ->select('assignee_id', DB::raw('count(*) as total'))
            ->groupBy('assignee_id')
            ->pluck('total', 'assignee_id');

        $resolvedCounts = Ticket::query()
            ->whereIn('assignee_id', $ids)
            ->whereIn('status', [TicketStatus::Resolved->value, TicketStatus::Closed->value])
            ->where('resolved_at', '>=', now()->subDays(30))
            ->select('assignee_id', DB::raw('count(*) as total'))
            ->groupBy('assignee_id')
            ->pluck('total', 'assignee_id');

        return $technicians
            ->map(fn (User $technician) => [
                'id' => $technician->id,
                'name' => $technician->name,
                'active' => (int) ($activeCounts[$technician->id] ?? 0),
                'resolved_30d' => (int) ($resolvedCounts[$technician->id] ?? 0),
            ])
            ->values();
    }
}
