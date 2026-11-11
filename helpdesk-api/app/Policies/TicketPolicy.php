<?php

namespace App\Policies;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTechnician()) {
            return $ticket->assignee_id === $user->id
                || ($ticket->assignee_id === null && $ticket->status === TicketStatus::New);
        }

        return $ticket->requester_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (! $user->isEmployee() || $ticket->requester_id !== $user->id) {
            return false;
        }

        return ! $ticket->status->isFinal();
    }

    public function assign(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin() && ! $ticket->status->isFinal();
    }

    public function take(User $user, Ticket $ticket): bool
    {
        return $user->canHandleTickets()
            && $ticket->assignee_id === null
            && $ticket->status === TicketStatus::New;
    }

    public function changeStatus(User $user, Ticket $ticket): bool
    {
        if ($ticket->status->isFinal()) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTechnician()) {
            return $ticket->assignee_id === $user->id;
        }

        return $ticket->requester_id === $user->id
            && $ticket->status === TicketStatus::Resolved;
    }

    public function reply(User $user, Ticket $ticket): bool
    {
        if ($ticket->status->isFinal()) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTechnician()) {
            return $ticket->assignee_id === $user->id;
        }

        return $ticket->requester_id === $user->id;
    }

    public function addAttachment(User $user, Ticket $ticket): bool
    {
        return $this->reply($user, $ticket);
    }

    public function viewInternal(User $user, Ticket $ticket): bool
    {
        return $user->canHandleTickets();
    }
}
