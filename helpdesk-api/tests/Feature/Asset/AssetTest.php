<?php

use App\Models\Asset;
use App\Models\Ticket;
use App\Models\User;

// ---------------------------------------------------------------------------
// Akses baca aset dan riwayat tiket
// ---------------------------------------------------------------------------

test('semua user terautentikasi dapat melihat daftar aset', function () {
    $this->loginAsEmployee();

    Asset::factory()->count(3)->create();

    $this->getJson('/api/v1/assets')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['total']]);
});

test('karyawan hanya melihat riwayat tiket aset miliknya', function () {
    $employee = $this->loginAsEmployee();
    $other = User::factory()->employee()->create();
    $asset = Asset::factory()->create();

    Ticket::factory()->create(['asset_id' => $asset->id, 'requester_id' => $employee->id]);
    Ticket::factory()->create(['asset_id' => $asset->id, 'requester_id' => $other->id]);

    $response = $this->getJson("/api/v1/assets/{$asset->id}")->assertOk();

    expect($response->json('data.tickets'))->toHaveCount(1);
    expect($response->json('data.tickets.0.requester'))->toBe($employee->name);
});

test('teknisi melihat seluruh riwayat tiket aset', function () {
    $technician = $this->loginAsTechnician();
    $asset = Asset::factory()->create();

    Ticket::factory()->assignedTo($technician)->create(['asset_id' => $asset->id]);
    Ticket::factory()->create(['asset_id' => $asset->id]);

    $response = $this->getJson("/api/v1/assets/{$asset->id}")->assertOk();

    expect($response->json('data.tickets'))->toHaveCount(2);
});

test('detail aset menampilkan jumlah tiket terkait', function () {
    $this->loginAsAdmin();
    $asset = Asset::factory()->create();

    Ticket::factory()->count(2)->create(['asset_id' => $asset->id]);

    $this->getJson("/api/v1/assets/{$asset->id}")
        ->assertOk()
        ->assertJsonPath('data.tickets_count', 2);
});

// ---------------------------------------------------------------------------
// CRUD aset (admin)
// ---------------------------------------------------------------------------

test('admin dapat membuat aset baru', function () {
    $this->loginAsAdmin();

    $this->postJson('/api/v1/assets', [
        'asset_tag' => 'AST-TEST-0001',
        'name' => 'Laptop Test',
        'category' => 'Komputer',
        'status' => 'active',
    ])->assertCreated()
        ->assertJsonPath('data.asset_tag', 'AST-TEST-0001');
});

test('admin dapat memperbarui aset', function () {
    $this->loginAsAdmin();
    $asset = Asset::factory()->create();

    $this->putJson("/api/v1/assets/{$asset->id}", [
        'asset_tag' => $asset->asset_tag,
        'name' => 'Nama Aset Baru',
        'status' => 'maintenance',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Nama Aset Baru')
        ->assertJsonPath('data.status', 'maintenance');
});

test('non-admin tidak dapat membuat aset', function () {
    $this->loginAsTechnician();

    $this->postJson('/api/v1/assets', [
        'asset_tag' => 'AST-TEST-0002',
        'name' => 'Laptop Test',
        'status' => 'active',
    ])->assertForbidden();
});

test('admin tidak dapat menghapus aset yang masih dipakai tiket', function () {
    $this->loginAsAdmin();
    $asset = Asset::factory()->create();
    Ticket::factory()->create(['asset_id' => $asset->id]);

    $this->deleteJson("/api/v1/assets/{$asset->id}")->assertStatus(422);

    expect(Asset::find($asset->id))->not->toBeNull();
});

test('admin dapat menghapus aset tanpa tiket', function () {
    $this->loginAsAdmin();
    $asset = Asset::factory()->create();

    $this->deleteJson("/api/v1/assets/{$asset->id}")->assertOk();

    expect(Asset::find($asset->id))->toBeNull();
});
