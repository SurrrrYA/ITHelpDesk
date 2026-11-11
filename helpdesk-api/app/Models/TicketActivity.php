<?php

namespace App\Models;

use Database\Factories\TicketActivityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketActivity extends Model
{
    /** @use HasFactory<TicketActivityFactory> */
    use HasFactory;

    public const ACTION_CREATED = 'created';

    public const ACTION_STATUS_CHANGED = 'status_changed';

    public const ACTION_ASSIGNED = 'assigned';

    public const ACTION_TAKEN = 'taken';

    public const ACTION_REPLIED = 'replied';

    public const ACTION_INTERNAL_NOTE = 'internal_note';

    public const ACTION_PRIORITY_CHANGED = 'priority_changed';

    public const ACTION_ATTACHMENT_ADDED = 'attachment_added';

    public const ACTION_REOPENED = 'reopened';

    public const ACTION_CLOSED = 'closed';

    public const ACTION_AUTO_CLOSED = 'auto_closed';

    public const ACTION_SLA_REMINDER_SENT = 'sla_reminder_sent';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ticket_id',
        'user_id',
        'action',
        'properties',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
