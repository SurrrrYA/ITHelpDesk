<?php

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

// ───────────────────────────────────────────
// Admin dashboard
// ───────────────────────────────────────────

test('admin mendapat summary dashboard lengkap', function () {
    $this->loginAsAdmin();

    Ticket::factory()->count(3)->create(['status' => TicketStatus::New]);
    Ticket::factory()->count(2)->inProgress()->create();

    $this->getJson('/api/v1/dashboard/summary')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'scope',
                'cards' => ['total', 'open', 'resolved', 'closed', 'unassigned', 'overdue'],
                'by_status',
                'by_priority',
                'by_category',
                'workload',
                'trend',
                'sla' => ['response_overdue', 'resolution_overdue'],
                'attention',
            ],
        ])
        ->assertJsonPath('data.scope', 'admin');
});

test('admin mendapat total tiket yang benar di dashboard', function () {
    $this->loginAsAdmin();

    Ticket::factory()->count(4)->create();

    $response = $this->getJson('/api/v1/dashboard/summary')->assertOk();
    expect($response->json('data.cards.total'))->toBe(4);
});

// ───────────────────────────────────────────
// Teknisi dashboard
// ───────────────────────────────────────────

test('teknisi mendapat summary hanya tiket miliknya dan antrean', function () {
    $technician = $this->loginAsTechnician();

    Ticket::factory()->assignedTo($technician)->count(2)->create();
    Ticket::factory()->create(['status' => TicketStatus::New, 'assignee_id' => null]); // antrean
    Ticket::factory()->assignedTo(User::factory()->technician()->create())->create(); // lain

    $response = $this->getJson('/api/v1/dashboard/summary')->assertOk();
    // scope harus technician
    expect($response->json('data.scope'))->toBe('technician');
    // total: 2 miliknya + 1 antrean = 3
    expect($response->json('data.cards.total'))->toBe(3);
});

// ───────────────────────────────────────────
// Karyawan dashboard
// ───────────────────────────────────────────

test('karyawan mendapat summary hanya tiket miliknya', function () {
    $employee = $this->loginAsEmployee();
    $other = User::factory()->employee()->create();

    Ticket::factory()->count(2)->create(['requester_id' => $employee->id]);
    Ticket::factory()->create(['requester_id' => $other->id]);

    $response = $this->getJson('/api/v1/dashboard/summary')->assertOk();
    expect($response->json('data.scope'))->toBe('employee');
    expect($response->json('data.cards.total'))->toBe(2);
});

test('dashboard membutuhkan autentikasi', function () {
    $this->getJson('/api/v1/dashboard/summary')->assertUnauthorized();
});
