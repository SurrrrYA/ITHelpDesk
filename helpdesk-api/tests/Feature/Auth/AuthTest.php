<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

// ───────────────────────────────────────────
// Login
// ───────────────────────────────────────────

test('login berhasil dengan kredensial yang valid', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => ['token', 'token_type', 'user' => ['id', 'name', 'email', 'role']],
        ]);
});

test('login gagal dengan password salah', function () {
    User::factory()->create(['email' => 'test@example.com']);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'password-salah',
    ])->assertStatus(422);
});

test('login gagal untuk akun nonaktif', function () {
    $user = User::factory()->inactive()->create([
        'email' => 'nonaktif@example.com',
        'password' => Hash::make('password123'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'nonaktif@example.com',
        'password' => 'password123',
    ])->assertStatus(422);
});

test('login gagal jika email tidak terdaftar', function () {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'tidakada@example.com',
        'password' => 'password123',
    ])->assertStatus(422);
});

// ───────────────────────────────────────────
// Me & Profile
// ───────────────────────────────────────────

test('GET /auth/me mengembalikan data user yang login', function () {
    $user = $this->loginAsEmployee();

    $this->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.email', $user->email)
        ->assertJsonStructure(['data' => ['id', 'name', 'email', 'role']]);
});

test('GET /auth/me ditolak tanpa token', function () {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

test('GET /auth/me tanpa header JSON tetap mengembalikan 401', function () {
    $this->get('/api/v1/auth/me')->assertUnauthorized();
});

test('PUT /auth/profile memperbarui nama, telepon, dan departemen', function () {
    $this->loginAsEmployee();

    $this->putJson('/api/v1/auth/profile', [
        'name' => 'Nama Baru',
        'phone' => '081234567890',
        'department' => 'IT',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Nama Baru');
});

test('PUT /auth/password memperbarui password dengan sukses', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password-lama'),
    ]);

    Sanctum::actingAs($user);

    $this->putJson('/api/v1/auth/password', [
        'current_password' => 'password-lama',
        'password' => 'password-baru123',
        'password_confirmation' => 'password-baru123',
    ])->assertOk();

    // Verifikasi password sudah berubah di DB
    expect(Hash::check('password-baru123', $user->fresh()->password))->toBeTrue();
});

test('PUT /auth/password gagal jika current_password salah', function () {
    $user = User::factory()->create(['password' => Hash::make('password-lama')]);
    Sanctum::actingAs($user);

    $this->putJson('/api/v1/auth/password', [
        'current_password' => 'salah',
        'password' => 'password-baru123',
        'password_confirmation' => 'password-baru123',
    ])->assertStatus(422);
});

// ───────────────────────────────────────────
// Logout
// ───────────────────────────────────────────

test('POST /auth/logout berhasil dan mengembalikan pesan sukses', function () {
    $this->loginAsEmployee();

    // Logout harus berhasil
    $this->postJson('/api/v1/auth/logout')
        ->assertOk()
        ->assertJsonFragment(['message' => 'Logout berhasil.']);
});

test('POST /auth/logout menghapus token dari database', function () {
    $user = User::factory()->create();

    // Login lewat HTTP untuk mendapatkan token nyata
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();

    $token = $response->json('data.token');

    // Logout dengan token tersebut
    $this->withToken($token)
        ->postJson('/api/v1/auth/logout')
        ->assertOk();

    // Pastikan token benar-benar terhapus dari database
    expect(PersonalAccessToken::count())->toBe(0);

    // Bersihkan cache guard agar request berikutnya benar-benar memakai token baru
    $this->app['auth']->forgetGuards();

    // Token sudah tidak valid — /me harus 401
    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});
