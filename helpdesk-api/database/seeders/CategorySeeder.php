<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Hardware & Perangkat', 'description' => 'Kerusakan laptop, desktop, monitor, dan perangkat keras lainnya.'],
            ['name' => 'Software & Aplikasi', 'description' => 'Instalasi, error aplikasi, dan pembaruan perangkat lunak.'],
            ['name' => 'Jaringan & Internet', 'description' => 'Masalah koneksi internet, Wi-Fi, VPN, dan jaringan kantor.'],
            ['name' => 'Akun & Akses', 'description' => 'Permintaan akun baru, reset password, dan hak akses sistem.'],
            ['name' => 'Printer & Periferal', 'description' => 'Printer, scanner, mouse, keyboard, dan periferal lainnya.'],
            ['name' => 'Lainnya', 'description' => 'Permintaan bantuan IT di luar kategori yang tersedia.'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'is_active' => true,
                ],
            );
        }
    }
}
