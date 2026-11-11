<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TicketAttachment>
 */
class TicketAttachmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fileName = fake()->word().'.png';

        return [
            'ticket_id' => Ticket::factory(),
            'ticket_reply_id' => null,
            'user_id' => User::factory(),
            'file_name' => $fileName,
            'file_path' => 'tickets/attachments/'.$fileName,
            'mime_type' => 'image/png',
            'file_size' => fake()->numberBetween(50_000, 3_000_000),
        ];
    }
}
