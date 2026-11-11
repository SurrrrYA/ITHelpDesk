<?php

namespace Database\Seeders;

use App\Enums\TicketPriority;
use App\Models\SlaPolicy;
use Illuminate\Database\Seeder;

class SlaPolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            ['priority' => TicketPriority::Urgent, 'response_minutes' => 15, 'resolution_minutes' => 240],
            ['priority' => TicketPriority::High, 'response_minutes' => 60, 'resolution_minutes' => 480],
            ['priority' => TicketPriority::Medium, 'response_minutes' => 240, 'resolution_minutes' => 1440],
            ['priority' => TicketPriority::Low, 'response_minutes' => 480, 'resolution_minutes' => 4320],
        ];

        foreach ($policies as $policy) {
            SlaPolicy::query()->updateOrCreate(
                ['priority' => $policy['priority']->value],
                [
                    'name' => 'SLA '.$policy['priority']->label(),
                    'response_minutes' => $policy['response_minutes'],
                    'resolution_minutes' => $policy['resolution_minutes'],
                    'is_active' => true,
                ],
            );
        }
    }
}
