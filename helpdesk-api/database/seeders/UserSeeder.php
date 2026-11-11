<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin Helpdesk',
                'email' => 'admin@helpdesk.test',
                'password' => 'Admin#12345',
                'role' => Role::Admin,
                'phone' => '081200000001',
                'department' => 'IT',
            ],
            [
                'name' => 'Teknisi Satu',
                'email' => 'teknisi1@helpdesk.test',
                'password' => 'Teknisi#12345',
                'role' => Role::Technician,
                'phone' => '081200000002',
                'department' => 'IT',
            ],
            [
                'name' => 'Teknisi Dua',
                'email' => 'teknisi2@helpdesk.test',
                'password' => 'Teknisi#12345',
                'role' => Role::Technician,
                'phone' => '081200000003',
                'department' => 'IT',
            ],
            [
                'name' => 'Karyawan Satu',
                'email' => 'karyawan1@helpdesk.test',
                'password' => 'Karyawan#12345',
                'role' => Role::Employee,
                'phone' => '081200000004',
                'department' => 'Keuangan',
            ],
            [
                'name' => 'Karyawan Dua',
                'email' => 'karyawan2@helpdesk.test',
                'password' => 'Karyawan#12345',
                'role' => Role::Employee,
                'phone' => '081200000005',
                'department' => 'Operasional',
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make($user['password']),
                    'role' => $user['role'],
                    'phone' => $user['phone'],
                    'department' => $user['department'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
