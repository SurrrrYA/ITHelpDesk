<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Database\Factories\TicketFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    /** @use HasFactory<TicketFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ticket_number',
        'subject',
        'description',
        'status',
        'priority',
        'category_id',
        'requester_id',
        'assignee_id',
        'asset_id',
        'sla_response_due_at',
        'sla_resolution_due_at',
        'sla_reminder_sent_at',
        'first_response_at',
        'resolved_at',
        'closed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
            'sla_response_due_at' => 'datetime',
            'sla_resolution_due_at' => 'datetime',
            'sla_reminder_sent_at' => 'datetime',
            'first_response_at' => 'datetime',
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TicketActivity::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', [
            TicketStatus::New->value,
            TicketStatus::Assigned->value,
            TicketStatus::InProgress->value,
        ]);
    }

    public function scopeUnassigned(Builder $query): Builder
    {
        return $query->whereNull('assignee_id')->where('status', TicketStatus::New->value);
    }

    public function isResponseOverdue(): bool
    {
        return $this->first_response_at === null
            && $this->sla_response_due_at !== null
            && $this->sla_response_due_at->isPast()
            && ! $this->status->isFinal();
    }

    public function isResolutionOverdue(): bool
    {
        return $this->resolved_at === null
            && $this->sla_resolution_due_at !== null
            && $this->sla_resolution_due_at->isPast()
            && ! $this->status->isFinal();
    }
}
