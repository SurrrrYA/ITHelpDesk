<?php

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use App\Policies\TicketPolicy;

// ───────────────────────────────────────────
// viewAny
// ───────────────────────────────────────────

test('viewAny: semua role dapat melihat daftar tiket', function () {
    $policy = new TicketPolicy;

    expect($policy->viewAny(User::factory()->make(['role' => 'employee'])))->toBeTrue();
    expect($policy->viewAny(User::factory()->make(['role' => 'technician'])))->toBeTrue();
    expect($policy->viewAny(User::factory()->make(['role' => 'admin'])))->toBeTrue();
});

// ───────────────────────────────────────────
// view
// ───────────────────────────────────────────

test('view: karyawan hanya bisa lihat tiket miliknya', function () {
    $employee = User::factory()->employee()->create();
    $own = Ticket::factory()->create(['requester_id' => $employee->id]);
    $others = Ticket::factory()->create();

    $policy = new TicketPolicy;
    expect($policy->view($employee, $own))->toBeTrue();
    expect($policy->view($employee, $others))->toBeFalse();
});

test('view: teknisi bisa lihat tiket yang ditugaskan padanya', function () {
    $technician = User::factory()->technician()->create();
    $assigned = Ticket::factory()->assignedTo($technician)->create();
    $others = Ticket::factory()->assignedTo(User::factory()->technician()->create())->create();

    $policy = new TicketPolicy;
    expect($policy->view($technician, $assigned))->toBeTrue();
    expect($policy->view($technician, $others))->toBeFalse();
});

test('view: teknisi bisa lihat tiket new tanpa assignee (antrean)', function () {
    $technician = User::factory()->technician()->create();
    $queued = Ticket::factory()->create(['status' => TicketStatus::New, 'assignee_id' => null]);

    expect((new TicketPolicy)->view($technician, $queued))->toBeTrue();
});

test('view: admin bisa lihat semua tiket', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create();

    expect((new TicketPolicy)->view($admin, $ticket))->toBeTrue();
});

// ───────────────────────────────────────────
// create
// ───────────────────────────────────────────

test('create: semua role dapat membuat tiket', function () {
    $policy = new TicketPolicy;

    expect($policy->create(User::factory()->employee()->make()))->toBeTrue();
    expect($policy->create(User::factory()->technician()->make()))->toBeTrue();
    expect($policy->create(User::factory()->admin()->make()))->toBeTrue();
});

// ───────────────────────────────────────────
// update
// ───────────────────────────────────────────

test('update: karyawan hanya bisa update tiket miliknya yang belum final', function () {
    $employee = User::factory()->employee()->create();
    $own = Ticket::factory()->create(['requester_id' => $employee->id, 'status' => TicketStatus::New]);
    $owned_closed = Ticket::factory()->closed()->create(['requester_id' => $employee->id]);
    $others = Ticket::factory()->create();

    $policy = new TicketPolicy;
    expect($policy->update($employee, $own))->toBeTrue();
    expect($policy->update($employee, $owned_closed))->toBeFalse();
    expect($policy->update($employee, $others))->toBeFalse();
});

test('update: admin bisa update tiket apapun', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create();

    expect((new TicketPolicy)->update($admin, $ticket))->toBeTrue();
});

// ───────────────────────────────────────────
// assign
// ───────────────────────────────────────────

test('assign: hanya admin yang dapat menugaskan tiket', function () {
    $policy = new TicketPolicy;
    $ticket = Ticket::factory()->create();

    expect($policy->assign(User::factory()->admin()->create(), $ticket))->toBeTrue();
    expect($policy->assign(User::factory()->technician()->create(), $ticket))->toBeFalse();
    expect($policy->assign(User::factory()->employee()->create(), $ticket))->toBeFalse();
});

test('assign: tidak bisa assign tiket yang sudah closed', function () {
    $admin = User::factory()->admin()->create();
    $closed = Ticket::factory()->closed()->create();

    expect((new TicketPolicy)->assign($admin, $closed))->toBeFalse();
});

// ───────────────────────────────────────────
// take
// ───────────────────────────────────────────

test('take: teknisi dapat take tiket new tanpa assignee', function () {
    $technician = User::factory()->technician()->create();
    $ticket = Ticket::factory()->create(['status' => TicketStatus::New, 'assignee_id' => null]);

    expect((new TicketPolicy)->take($technician, $ticket))->toBeTrue();
});

test('take: karyawan tidak dapat take tiket', function () {
    $employee = User::factory()->employee()->create();
    $ticket = Ticket::factory()->create(['status' => TicketStatus::New, 'assignee_id' => null]);

    expect((new TicketPolicy)->take($employee, $ticket))->toBeFalse();
});

test('take: tidak bisa take tiket yang sudah ada assignee', function () {
    $technician = User::factory()->technician()->create();
    $other = User::factory()->technician()->create();
    $ticket = Ticket::factory()->assignedTo($other)->create();

    expect((new TicketPolicy)->take($technician, $ticket))->toBeFalse();
});

// ───────────────────────────────────────────
// changeStatus
// ───────────────────────────────────────────

test('changeStatus: ditolak untuk tiket closed', function () {
    $admin = User::factory()->admin()->create();
    $closed = Ticket::factory()->closed()->create();

    expect((new TicketPolicy)->changeStatus($admin, $closed))->toBeFalse();
});

test('changeStatus: teknisi hanya bisa ubah tiket miliknya', function () {
    $technician = User::factory()->technician()->create();
    $own = Ticket::factory()->assignedTo($technician)->create();
    $others = Ticket::factory()->assignedTo(User::factory()->technician()->create())->create();

    $policy = new TicketPolicy;
    expect($policy->changeStatus($technician, $own))->toBeTrue();
    expect($policy->changeStatus($technician, $others))->toBeFalse();
});

test('changeStatus: karyawan hanya bisa ubah tiket resolved miliknya', function () {
    $employee = User::factory()->employee()->create();
    $resolved = Ticket::factory()->resolved()->create(['requester_id' => $employee->id]);
    $open = Ticket::factory()->create(['requester_id' => $employee->id, 'status' => TicketStatus::New]);

    $policy = new TicketPolicy;
    expect($policy->changeStatus($employee, $resolved))->toBeTrue();
    expect($policy->changeStatus($employee, $open))->toBeFalse();
});

// ───────────────────────────────────────────
// reply & viewInternal
// ───────────────────────────────────────────

test('reply: karyawan bisa balas tiket miliknya selama belum closed', function () {
    $employee = User::factory()->employee()->create();
    $own = Ticket::factory()->create(['requester_id' => $employee->id]);
    $closed = Ticket::factory()->closed()->create(['requester_id' => $employee->id]);

    $policy = new TicketPolicy;
    expect($policy->reply($employee, $own))->toBeTrue();
    expect($policy->reply($employee, $closed))->toBeFalse();
});

test('viewInternal: hanya teknisi dan admin', function () {
    $policy = new TicketPolicy;
    $ticket = Ticket::factory()->make();

    expect($policy->viewInternal(User::factory()->technician()->make(), $ticket))->toBeTrue();
    expect($policy->viewInternal(User::factory()->admin()->make(), $ticket))->toBeTrue();
    expect($policy->viewInternal(User::factory()->employee()->make(), $ticket))->toBeFalse();
});
