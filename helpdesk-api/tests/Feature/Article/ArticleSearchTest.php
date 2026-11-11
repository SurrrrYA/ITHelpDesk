<?php

use App\Models\Article;

// ---------------------------------------------------------------------------
// Pencarian artikel (full-text PostgreSQL)
// ---------------------------------------------------------------------------

test('pencarian artikel menemukan judul dan isi yang cocok', function () {
    $this->loginAsEmployee();

    Article::factory()->create([
        'title' => 'Panduan Reset Password',
        'excerpt' => 'Langkah reset password akun kantor.',
        'body' => 'Buka halaman pengaturan lalu pilih reset password.',
    ]);

    Article::factory()->create([
        'title' => 'Cara Mengatur Printer',
        'excerpt' => 'Panduan printer jaringan.',
        'body' => 'Tambahkan printer melalui menu perangkat.',
    ]);

    $response = $this->getJson('/api/v1/articles?q=password')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.title'))->toBe('Panduan Reset Password');
});

test('pencarian artikel tidak case-sensitive', function () {
    $this->loginAsEmployee();

    Article::factory()->create([
        'title' => 'Jaringan Kantor Sering Putus',
        'body' => 'Periksa kabel LAN dan switch.',
    ]);

    $response = $this->getJson('/api/v1/articles?q=JARINGAN')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
});

test('pencarian artikel tidak membocorkan draft ke karyawan', function () {
    $this->loginAsEmployee();

    Article::factory()->draft()->create([
        'title' => 'Draft Rahasia Jaringan',
        'body' => 'Materi internal.',
    ]);

    $response = $this->getJson('/api/v1/articles?q=jaringan')->assertOk();

    expect($response->json('data'))->toHaveCount(0);
});

test('filter status draft hanya berlaku untuk staf', function () {
    $this->loginAsTechnician();

    Article::factory()->create(['title' => 'Artikel Terbit']);
    Article::factory()->draft()->create(['title' => 'Artikel Draft']);

    $response = $this->getJson('/api/v1/articles?status=draft')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.title'))->toBe('Artikel Draft');
});

// ---------------------------------------------------------------------------
// Detail artikel
// ---------------------------------------------------------------------------

test('membuka artikel menambah jumlah views', function () {
    $this->loginAsEmployee();
    $article = Article::factory()->create(['views' => 5]);

    $this->getJson("/api/v1/articles/{$article->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $article->id)
        ->assertJsonPath('data.views', 6);
});

test('karyawan tidak dapat membuka artikel draft', function () {
    $this->loginAsEmployee();
    $article = Article::factory()->draft()->create();

    $this->getJson("/api/v1/articles/{$article->id}")->assertForbidden();
});

test('teknisi dapat membuka artikel draft', function () {
    $this->loginAsTechnician();
    $article = Article::factory()->draft()->create();

    $this->getJson("/api/v1/articles/{$article->id}")->assertOk();
});
