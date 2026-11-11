<?php

use App\Models\Article;
use App\Models\User;
use App\Policies\ArticlePolicy;

// ───────────────────────────────────────────
// Visibilitas (view)
// ───────────────────────────────────────────

test('karyawan hanya bisa lihat artikel yang sudah published via API', function () {
    $this->loginAsEmployee();

    Article::factory()->create(['is_published' => true]);
    Article::factory()->draft()->create();

    $response = $this->getJson('/api/v1/articles')->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

test('teknisi bisa lihat semua artikel termasuk draft miliknya', function () {
    $technician = $this->loginAsTechnician();

    Article::factory()->create(['is_published' => true]);
    Article::factory()->draft()->create(['user_id' => $technician->id]);

    $response = $this->getJson('/api/v1/articles')->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// ───────────────────────────────────────────
// Policy — create
// ───────────────────────────────────────────

test('karyawan tidak dapat membuat artikel', function () {
    $this->loginAsEmployee();

    $this->postJson('/api/v1/articles', [
        'title' => 'Artikel Test',
        'excerpt' => 'Ringkasan.',
        'body' => 'Isi artikel test.',
        'is_published' => true,
    ])->assertForbidden();
});

test('teknisi dapat membuat artikel', function () {
    $this->loginAsTechnician();

    $this->postJson('/api/v1/articles', [
        'title' => 'Panduan Reset Password',
        'excerpt' => 'Cara reset password.',
        'body' => 'Langkah-langkah reset password...',
        'is_published' => true,
    ])->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'title', 'slug']]);
});

test('admin dapat membuat artikel', function () {
    $this->loginAsAdmin();

    $this->postJson('/api/v1/articles', [
        'title' => 'Panduan Admin',
        'excerpt' => 'Panduan untuk admin.',
        'body' => 'Isi panduan admin...',
        'is_published' => true,
    ])->assertCreated();
});

// ───────────────────────────────────────────
// Policy — update & delete
// ───────────────────────────────────────────

test('teknisi bisa update artikel miliknya sendiri', function () {
    $technician = $this->loginAsTechnician();
    $article = Article::factory()->create(['user_id' => $technician->id]);

    $this->putJson("/api/v1/articles/{$article->id}", [
        'title' => 'Judul Diperbarui',
        'excerpt' => $article->excerpt,
        'body' => $article->body,
        'is_published' => true,
    ])->assertOk()
        ->assertJsonPath('data.title', 'Judul Diperbarui');
});

test('teknisi tidak bisa update artikel milik teknisi lain', function () {
    $this->loginAsTechnician();
    $otherArticle = Article::factory()->create(); // milik teknisi lain (dari factory default)

    $this->putJson("/api/v1/articles/{$otherArticle->id}", [
        'title' => 'Coba Ubah',
        'excerpt' => $otherArticle->excerpt,
        'body' => $otherArticle->body,
        'is_published' => true,
    ])->assertForbidden();
});

test('admin bisa update artikel milik siapapun', function () {
    $this->loginAsAdmin();
    $article = Article::factory()->create();

    $this->putJson("/api/v1/articles/{$article->id}", [
        'title' => 'Admin Edit',
        'excerpt' => $article->excerpt,
        'body' => $article->body,
        'is_published' => true,
    ])->assertOk();
});

test('teknisi tidak bisa delete artikel milik teknisi lain', function () {
    $this->loginAsTechnician();
    $otherArticle = Article::factory()->create();

    $this->deleteJson("/api/v1/articles/{$otherArticle->id}")->assertForbidden();
});

test('teknisi bisa delete artikel miliknya', function () {
    $technician = $this->loginAsTechnician();
    $article = Article::factory()->create(['user_id' => $technician->id]);

    $this->deleteJson("/api/v1/articles/{$article->id}")->assertOk();
});

test('admin bisa delete artikel siapapun', function () {
    $this->loginAsAdmin();
    $article = Article::factory()->create();

    $this->deleteJson("/api/v1/articles/{$article->id}")->assertOk();
});

// ───────────────────────────────────────────
// Policy langsung
// ───────────────────────────────────────────

test('policy view: karyawan tidak bisa lihat artikel draft orang lain', function () {
    $employee = User::factory()->employee()->create();
    $draft = Article::factory()->draft()->create();

    expect((new ArticlePolicy)->view($employee, $draft))->toBeFalse();
});

test('policy view: karyawan bisa lihat artikel published', function () {
    $employee = User::factory()->employee()->create();
    $published = Article::factory()->create(['is_published' => true]);

    expect((new ArticlePolicy)->view($employee, $published))->toBeTrue();
});
