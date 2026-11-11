<?php

namespace Database\Factories;

use App\Enums\TicketPriority;
use App\Models\SlaPolicy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SlaPolicy>
 */
class SlaPolicyFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'SLA '.fake()->unique()->word(),
            'priority' => fake()->randomElement(TicketPriority::cases()),
            'response_minutes' => fake()->randomElement([15, 60, 240, 480]),
            'resolution_minutes' => fake()->randomElement([240, 480, 1440, 4320]),
            'is_active' => true,
        ];
    }

    public function forPriority(TicketPriority $priority): static
    {
        return $this->state(fn () => [
            'name' => 'SLA '.$priority->label(),
            'priority' => $priority,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
