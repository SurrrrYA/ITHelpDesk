<?php

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Category;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\User;

// ───────────────────────────────────────────
// Buat tiket
// ───────────────────────────────────────────

test('karyawan dapat membuat tiket baru', function () {
    $this->loginAsEmployee();
    $category = Category::factory()->create();
    SlaPolicy::factory()->forPriority(TicketPriority::Medium)->create();

    $this->postJson('/api/v1/tickets', [
        'subject' => 'Komputer tidak bisa menyala',
        'description' => 'PC saya tidak bisa dihidupkan sejak pagi.',
        'category_id' => $category->id,
        'priority' => 'medium',
    ])->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'ticket_number', 'subject', 'status']]);
});

test('nomor tiket mengikuti format TKT-YYYYMMDD-NNNN', function () {
    $this->loginAsEmployee();
    $category = Category::factory()->create();
    SlaPolicy::factory()->forPriority(TicketPriority::Low)->create();

    $response = $this->postJson('/api/v1/tickets', [
        'subject' => 'Test Format Nomor',
        'description' => 'Deskripsi.',
        'category_id' => $category->id,
        'priority' => 'low',
    ])->assertCreated();

    $ticketNumber = $response->json('data.ticket_number');
    expect($ticketNumber)->toMatch('/^TKT-\d{8}-\d{4}$/');
});

test('SLA due date terisi otomatis saat tiket dibuat', function () {
    $this->loginAsEmployee();
    $category = Category::factory()->create();
    SlaPolicy::factory()->forPriority(TicketPriority::High)->create([
        'response_minutes' => 60,
        'resolution_minutes' => 480,
    ]);

    $response = $this->postJson('/api/v1/tickets', [
        'subject' => 'Test SLA',
        'description' => 'Deskripsi.',
        'category_id' => $category->id,
        'priority' => 'high',
    ])->assertCreated();

    expect($response->json('data.sla_response_due_at'))->not->toBeNull();
    expect($response->json('data.sla_resolution_due_at'))->not->toBeNull();
});

test('validasi gagal jika subject kosong', function () {
    $this->loginAsEmployee();
    $category = Category::factory()->create();

    $this->postJson('/api/v1/tickets', [
        'subject' => '',
        'description' => 'Deskripsi.',
        'category_id' => $category->id,
        'priority' => 'medium',
    ])->assertStatus(422)->assertJsonValidationErrors(['subject']);
});

// ───────────────────────────────────────────
// Visibilitas daftar tiket per role
// ───────────────────────────────────────────

test('karyawan hanya melihat tiket miliknya sendiri', function () {
    $employee = $this->loginAsEmployee();
    $other = User::factory()->employee()->create();

    Ticket::factory()->create(['requester_id' => $employee->id]);
    Ticket::factory()->create(['requester_id' => $employee->id]);
    Ticket::factory()->create(['requester_id' => $other->id]); // bukan miliknya

    $response = $this->getJson('/api/v1/tickets')->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

test('teknisi melihat tiket yang ditugaskan dan antrean new', function () {
    $technician = $this->loginAsTechnician();

    Ticket::factory()->assignedTo($technician)->create(); // miliknya
    Ticket::factory()->assignedTo($technician)->create(); // miliknya
    Ticket::factory()->create(['status' => TicketStatus::New, 'assignee_id' => null]); // antrean
    Ticket::factory()->assignedTo(User::factory()->technician()->create())->create(); // milik teknisi lain

    $response = $this->getJson('/api/v1/tickets')->assertOk();
    // 2 assigned + 1 new queue = 3 (tiket teknisi lain tidak terlihat)
    expect($response->json('data'))->toHaveCount(3);
});

test('admin melihat semua tiket', function () {
    $this->loginAsAdmin();

    Ticket::factory()->count(5)->create();

    $response = $this->getJson('/api/v1/tickets')->assertOk();
    expect($response->json('data'))->toHaveCount(5);
});

// ───────────────────────────────────────────
// Filter & pencarian
// ───────────────────────────────────────────

test('filter tiket berdasarkan status', function () {
    $this->loginAsAdmin();

    Ticket::factory()->create(['status' => TicketStatus::New]);
    Ticket::factory()->create(['status' => TicketStatus::New]);
    Ticket::factory()->inProgress()->create();

    $response = $this->getJson('/api/v1/tickets?status=new')->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

test('filter tiket berdasarkan prioritas', function () {
    $this->loginAsAdmin();

    Ticket::factory()->priority(TicketPriority::Urgent)->create();
    Ticket::factory()->priority(TicketPriority::Low)->create();
    Ticket::factory()->priority(TicketPriority::Low)->create();

    $response = $this->getJson('/api/v1/tickets?priority=urgent')->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

test('pencarian tiket berdasarkan subject (ilike)', function () {
    $this->loginAsAdmin();

    Ticket::factory()->create(['subject' => 'Komputer Mati Total']);
    Ticket::factory()->create(['subject' => 'Printer Tidak Merespon']);
    Ticket::factory()->create(['subject' => 'komputer lambat sekali']);

    // Filter ?q=komputer harus dapat 2 tiket (Komputer & komputer, case-insensitive)
    $response = $this->getJson('/api/v1/tickets?q=komputer')->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

test('response daftar tiket memiliki struktur paginasi', function () {
    $this->loginAsAdmin();
    Ticket::factory()->count(3)->create();

    $this->getJson('/api/v1/tickets')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['total', 'per_page', 'current_page']]);
});
