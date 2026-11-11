<?php

namespace App\Services;

use App\Models\Ticket;
use Illuminate\Support\Facades\DB;

class TicketNumberService
{
    public function next(): string
    {
        $date = now()->format('Ymd');

        return DB::transaction(function () use ($date) {
            if (DB::getDriverName() === 'pgsql') {
                DB::select('SELECT pg_advisory_xact_lock(?)', [crc32('tickets-'.$date)]);
            }

            $prefix = "TKT-{$date}-";

            $lastNumber = Ticket::query()
                ->where('ticket_number', 'like', $prefix.'%')
                ->orderByDesc('ticket_number')
                ->value('ticket_number');

            $sequence = $lastNumber
                ? ((int) substr($lastNumber, -4)) + 1
                : 1;

            return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
        });
    }
}
