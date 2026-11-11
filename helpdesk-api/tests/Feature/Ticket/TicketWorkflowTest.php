<?php

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

// ───────────────────────────────────────────
// Assign & Take
// ───────────────────────────────────────────

test('admin dapat menugaskan tiket ke teknisi', function () {
    $admin = $this->loginAsAdmin();
    $technician = User::factory()->technician()->create();
    $ticket = Ticket::factory()->create(['status' => TicketStatus::New]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/assign", [
        'assignee_id' => $technician->id,
    ])->assertOk()
        ->assertJsonPath('data.status', 'assigned')
        ->assertJsonPath('data.assignee.id', $technician->id);
});

test('penugasan tiket mencatat activity', function () {
    $admin = $this->loginAsAdmin();
    $technician = User::factory()->technician()->create();
    $ticket = Ticket::factory()->create(['status' => TicketStatus::New]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/assign", [
        'assignee_id' => $technician->id,
    ])->assertOk();

    expect($ticket->fresh()->activities()->count())->toBeGreaterThan(0);
});

test('teknisi dapat mengambil tiket dari antrean (take)', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->create([
        'status' => TicketStatus::New,
        'assignee_id' => null,
    ]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/take")
        ->assertOk()
        ->assertJsonPath('data.status', 'assigned')
        ->assertJsonPath('data.assignee.id', $technician->id);
});

test('karyawan tidak dapat take tiket', function () {
    $this->loginAsEmployee();
    $ticket = Ticket::factory()->create(['status' => TicketStatus::New, 'assignee_id' => null]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/take")->assertForbidden();
});

test('teknisi tidak dapat take tiket yang sudah diambil', function () {
    $this->loginAsTechnician();
    $otherTech = User::factory()->technician()->create();
    $ticket = Ticket::factory()->assignedTo($otherTech)->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/take")->assertForbidden();
});

// ───────────────────────────────────────────
// Ubah status
// ───────────────────────────────────────────

test('teknisi dapat mengubah status tiket yang ditugaskan padanya', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/status", [
        'status' => 'in_progress',
    ])->assertOk()
        ->assertJsonPath('data.status', 'in_progress');
});

test('teknisi tidak dapat mengubah status tiket milik teknisi lain', function () {
    $this->loginAsTechnician();
    $otherTech = User::factory()->technician()->create();
    $ticket = Ticket::factory()->assignedTo($otherTech)->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/status", [
        'status' => 'in_progress',
    ])->assertForbidden();
});

test('karyawan dapat menutup tiket miliknya yang sudah resolved', function () {
    $employee = $this->loginAsEmployee();
    $ticket = Ticket::factory()->resolved()->create(['requester_id' => $employee->id]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/status", [
        'status' => 'closed',
    ])->assertOk()
        ->assertJsonPath('data.status', 'closed');
});

test('karyawan dapat membuka kembali tiket resolved miliknya', function () {
    $employee = $this->loginAsEmployee();
    $ticket = Ticket::factory()->resolved()->create(['requester_id' => $employee->id]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/status", [
        'status' => 'in_progress',
    ])->assertOk()
        ->assertJsonPath('data.status', 'in_progress');
});

test('tiket closed tidak dapat diubah statusnya (admin mendapat 403 dari policy)', function () {
    $this->loginAsAdmin();
    $ticket = Ticket::factory()->closed()->create();

    // Policy TicketPolicy@changeStatus mengembalikan false untuk tiket closed → 403
    $this->postJson("/api/v1/tickets/{$ticket->id}/status", [
        'status' => 'in_progress',
    ])->assertForbidden();
});

test('transisi status tidak valid ditolak', function () {
    $admin = $this->loginAsAdmin();
    $ticket = Ticket::factory()->create(['status' => TicketStatus::New]);

    // new → closed bukan transisi yang valid
    $this->postJson("/api/v1/tickets/{$ticket->id}/status", [
        'status' => 'closed',
    ])->assertStatus(422);
});

test('resolved_at terisi saat tiket menjadi resolved', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->inProgress()->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/status", ['status' => 'resolved'])->assertOk();

    expect($ticket->fresh()->resolved_at)->not->toBeNull();
});

test('setiap perubahan status tercatat di ticket_activities', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    $countBefore = $ticket->activities()->count();

    $this->postJson("/api/v1/tickets/{$ticket->id}/status", ['status' => 'in_progress'])->assertOk();

    expect($ticket->activities()->count())->toBeGreaterThan($countBefore);
});
