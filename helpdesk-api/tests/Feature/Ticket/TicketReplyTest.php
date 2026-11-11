<?php

use App\Models\Ticket;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// ───────────────────────────────────────────
// Visibilitas balasan
// ───────────────────────────────────────────

test('karyawan dapat membalas tiket miliknya', function () {
    $employee = $this->loginAsEmployee();
    $ticket = Ticket::factory()->create(['requester_id' => $employee->id]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Ini balasan dari karyawan.',
        'is_internal' => false,
    ])->assertCreated();
});

test('karyawan tidak dapat membalas tiket milik orang lain', function () {
    $this->loginAsEmployee();
    $other = User::factory()->employee()->create();
    $ticket = Ticket::factory()->create(['requester_id' => $other->id]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Ini balasan tidak sah.',
    ])->assertForbidden();
});

test('teknisi dapat membalas tiket yang ditugaskan padanya', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Sedang kami proses.',
        'is_internal' => false,
    ])->assertCreated();
});

// ───────────────────────────────────────────
// Catatan internal
// ───────────────────────────────────────────

test('catatan internal tidak terlihat oleh karyawan', function () {
    $technician = $this->loginAsTechnician();
    $employee = User::factory()->employee()->create();
    $ticket = Ticket::factory()->assignedTo($technician)->create(['requester_id' => $employee->id]);

    // Teknisi buat catatan internal
    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Catatan internal rahasia.',
        'is_internal' => true,
    ])->assertCreated();

    // Login sebagai karyawan, GET replies — catatan internal tidak boleh muncul
    Sanctum::actingAs($employee);
    $response = $this->getJson("/api/v1/tickets/{$ticket->id}/replies")->assertOk();

    $bodies = collect($response->json('data'))->pluck('body');
    expect($bodies)->not->toContain('Catatan internal rahasia.');
});

test('catatan internal terlihat oleh teknisi', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Catatan internal untuk teknisi.',
        'is_internal' => true,
    ])->assertCreated();

    $response = $this->getJson("/api/v1/tickets/{$ticket->id}/replies")->assertOk();
    $bodies = collect($response->json('data'))->pluck('body');
    expect($bodies)->toContain('Catatan internal untuk teknisi.');
});

test('catatan internal terlihat oleh admin', function () {
    $admin = $this->loginAsAdmin();
    $technician = User::factory()->technician()->create();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    // Teknisi buat catatan internal
    Sanctum::actingAs($technician);
    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Catatan internal untuk admin.',
        'is_internal' => true,
    ])->assertCreated();

    // Admin bisa lihat
    Sanctum::actingAs($admin);
    $response = $this->getJson("/api/v1/tickets/{$ticket->id}/replies")->assertOk();
    $bodies = collect($response->json('data'))->pluck('body');
    expect($bodies)->toContain('Catatan internal untuk admin.');
});

test('karyawan tidak dapat membuat catatan internal', function () {
    $employee = $this->loginAsEmployee();
    $ticket = Ticket::factory()->create(['requester_id' => $employee->id]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Coba buat catatan internal.',
        'is_internal' => true,
    ])->assertForbidden();
});

// ───────────────────────────────────────────
// first_response_at
// ───────────────────────────────────────────

test('first_response_at terisi saat teknisi pertama kali membalas (bukan internal)', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    expect($ticket->fresh()->first_response_at)->toBeNull();

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Balas pertama dari teknisi.',
        'is_internal' => false,
    ])->assertCreated();

    expect($ticket->fresh()->first_response_at)->not->toBeNull();
});

test('first_response_at tidak berubah saat ada balasan berikutnya', function () {
    $technician = $this->loginAsTechnician();
    $ticket = Ticket::factory()->assignedTo($technician)->create();

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", ['body' => 'Balasan pertama.'])->assertCreated();
    $firstResponseAt = $ticket->fresh()->first_response_at;

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", ['body' => 'Balasan kedua.'])->assertCreated();

    expect($ticket->fresh()->first_response_at->toIso8601String())
        ->toBe($firstResponseAt->toIso8601String());
});

// ───────────────────────────────────────────
// Tiket closed tidak bisa dibalas
// ───────────────────────────────────────────

test('tidak bisa membalas tiket yang sudah closed', function () {
    $employee = $this->loginAsEmployee();
    $ticket = Ticket::factory()->closed()->create(['requester_id' => $employee->id]);

    $this->postJson("/api/v1/tickets/{$ticket->id}/replies", [
        'body' => 'Coba balas tiket closed.',
    ])->assertForbidden();
});
