<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Login sebagai user dengan role tertentu dan kembalikan instance user-nya.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function loginAs(string $role, array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['role' => $role], $overrides));
        Sanctum::actingAs($user);

        return $user;
    }

    protected function loginAsAdmin(array $overrides = []): User
    {
        return $this->loginAs('admin', $overrides);
    }

    protected function loginAsTechnician(array $overrides = []): User
    {
        return $this->loginAs('technician', $overrides);
    }

    protected function loginAsEmployee(array $overrides = []): User
    {
        return $this->loginAs('employee', $overrides);
    }
}
