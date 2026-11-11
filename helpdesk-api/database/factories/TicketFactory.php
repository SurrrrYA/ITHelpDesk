<?php

namespace Database\Factories;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $priority = fake()->randomElement(TicketPriority::cases());

        return [
            'ticket_number' => 'TKT-'.now()->format('Ymd').'-'.fake()->unique()->numerify('####'),
            'subject' => fake()->sentence(6),
            'description' => fake()->paragraph(),
            'status' => TicketStatus::New,
            'priority' => $priority,
            'category_id' => Category::factory(),
            'requester_id' => User::factory()->employee(),
            'assignee_id' => null,
            'asset_id' => null,
            'sla_response_due_at' => now()->addMinutes(240),
            'sla_resolution_due_at' => now()->addMinutes(1440),
        ];
    }

    public function assignedTo(User $technician): static
    {
        return $this->state(fn () => [
            'assignee_id' => $technician->id,
            'status' => TicketStatus::Assigned,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => ['status' => TicketStatus::InProgress]);
    }

    public function resolved(): static
    {
        return $this->state(fn () => [
            'status' => TicketStatus::Resolved,
            'resolved_at' => now(),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => TicketStatus::Closed,
            'resolved_at' => now()->subDay(),
            'closed_at' => now(),
        ]);
    }

    public function priority(TicketPriority $priority): static
    {
        return $this->state(fn () => ['priority' => $priority]);
    }
}
