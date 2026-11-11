<?php

use App\Models\Category;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\User;

// ───────────────────────────────────────────
// Kategori
// ───────────────────────────────────────────

test('admin dapat membuat kategori baru', function () {
    $this->loginAsAdmin();

    $this->postJson('/api/v1/categories', [
        'name' => 'Hardware',
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Hardware');
});

test('admin dapat memperbarui kategori', function () {
    $this->loginAsAdmin();
    $category = Category::factory()->create();

    $this->putJson("/api/v1/categories/{$category->id}", [
        'name' => 'Kategori Diperbarui',
        'is_active' => true,
    ])->assertOk()
        ->assertJsonPath('data.name', 'Kategori Diperbarui');
});

test('admin dapat menghapus kategori yang tidak dipakai', function () {
    $this->loginAsAdmin();
    $category = Category::factory()->create();

    $this->deleteJson("/api/v1/categories/{$category->id}")->assertOk();

    expect(Category::find($category->id))->toBeNull();
});

test('tidak bisa menghapus kategori yang masih dipakai tiket', function () {
    $this->loginAsAdmin();
    $category = Category::factory()->create();
    Ticket::factory()->create(['category_id' => $category->id]);

    $this->deleteJson("/api/v1/categories/{$category->id}")->assertStatus(422);
});

test('non-admin tidak bisa CRUD kategori', function () {
    $this->loginAsEmployee();
    $category = Category::factory()->create();

    $this->postJson('/api/v1/categories', ['name' => 'Test'])->assertForbidden();
    $this->putJson("/api/v1/categories/{$category->id}", ['name' => 'Test'])->assertForbidden();
    $this->deleteJson("/api/v1/categories/{$category->id}")->assertForbidden();
});

// ───────────────────────────────────────────
// SLA Policy
// ───────────────────────────────────────────

test('admin dapat membuat SLA policy baru', function () {
    $this->loginAsAdmin();

    $this->postJson('/api/v1/sla-policies', [
        'name' => 'SLA Urgent Baru',
        'priority' => 'urgent',
        'response_minutes' => 15,
        'resolution_minutes' => 240,
        'is_active' => true,
    ])->assertCreated();
});

test('admin dapat menghapus SLA policy', function () {
    $this->loginAsAdmin();
    $sla = SlaPolicy::factory()->create();

    $this->deleteJson("/api/v1/sla-policies/{$sla->id}")->assertOk();
    expect(SlaPolicy::find($sla->id))->toBeNull();
});

test('non-admin tidak bisa akses CRUD SLA', function () {
    $this->loginAsTechnician();

    $this->postJson('/api/v1/sla-policies', ['name' => 'Test'])->assertForbidden();
});

// ───────────────────────────────────────────
// User management
// ───────────────────────────────────────────

test('admin dapat membuat user baru', function () {
    $this->loginAsAdmin();

    $this->postJson('/api/v1/users', [
        'name' => 'User Baru',
        'email' => 'userbaru@example.com',
        'role' => 'employee',
        'password' => 'Password#123',
        'password_confirmation' => 'Password#123',
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.email', 'userbaru@example.com');
});

test('admin dapat memperbarui user', function () {
    $this->loginAsAdmin();
    $user = User::factory()->employee()->create();

    $this->putJson("/api/v1/users/{$user->id}", [
        'name' => 'Nama Diperbarui',
        'email' => $user->email,
        'role' => 'employee',
        'is_active' => true,
    ])->assertOk()
        ->assertJsonPath('data.name', 'Nama Diperbarui');
});

test('admin dapat menghapus user tanpa riwayat', function () {
    $this->loginAsAdmin();
    $user = User::factory()->employee()->create();

    $this->deleteJson("/api/v1/users/{$user->id}")->assertOk();
    expect(User::find($user->id))->toBeNull();
});

test('tidak bisa menghapus user yang punya riwayat tiket', function () {
    $this->loginAsAdmin();
    $employee = User::factory()->employee()->create();
    Ticket::factory()->create(['requester_id' => $employee->id]);

    $this->deleteJson("/api/v1/users/{$employee->id}")->assertStatus(422);
});

test('non-admin tidak bisa akses CRUD user', function () {
    $this->loginAsEmployee();
    $user = User::factory()->create();

    $this->getJson('/api/v1/users')->assertForbidden();
    $this->postJson('/api/v1/users', [])->assertForbidden();
    $this->putJson("/api/v1/users/{$user->id}", [])->assertForbidden();
    $this->deleteJson("/api/v1/users/{$user->id}")->assertForbidden();
});
