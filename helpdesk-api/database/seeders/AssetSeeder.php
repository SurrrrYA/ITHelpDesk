<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()->pluck('id', 'email');

        $assets = [
            [
                'asset_tag' => 'AST-LT-0001',
                'name' => 'Laptop Lenovo ThinkPad T14',
                'category' => 'Komputer',
                'brand' => 'Lenovo',
                'model' => 'ThinkPad T14 Gen 4',
                'serial_number' => 'PF4XK2A1',
                'purchased_at' => '2024-02-12',
                'assigned_to' => $users['karyawan1@helpdesk.test'] ?? null,
                'status' => Asset::STATUS_ACTIVE,
                'notes' => 'Laptop operasional karyawan, garansi sampai Februari 2027.',
            ],
            [
                'asset_tag' => 'AST-LT-0002',
                'name' => 'Laptop Dell Latitude 5440',
                'category' => 'Komputer',
                'brand' => 'Dell',
                'model' => 'Latitude 5440',
                'serial_number' => 'DL5440X92',
                'purchased_at' => '2024-06-03',
                'assigned_to' => $users['karyawan2@helpdesk.test'] ?? null,
                'status' => Asset::STATUS_ACTIVE,
                'notes' => null,
            ],
            [
                'asset_tag' => 'AST-LT-0003',
                'name' => 'Laptop HP EliteBook 840',
                'category' => 'Komputer',
                'brand' => 'HP',
                'model' => 'EliteBook 840 G9',
                'serial_number' => 'HP840G9C31',
                'purchased_at' => '2023-11-20',
                'assigned_to' => $users['teknisi1@helpdesk.test'] ?? null,
                'status' => Asset::STATUS_ACTIVE,
                'notes' => 'Dipakai untuk remote troubleshooting.',
            ],
            [
                'asset_tag' => 'AST-PR-0001',
                'name' => 'Printer Epson L3250 Lantai 2',
                'category' => 'Periferal',
                'brand' => 'Epson',
                'model' => 'EcoTank L3250',
                'serial_number' => 'EPL3250A77',
                'purchased_at' => '2023-08-15',
                'assigned_to' => null,
                'status' => Asset::STATUS_ACTIVE,
                'notes' => 'Printer bersama di dekat ruang meeting lantai 2.',
            ],
            [
                'asset_tag' => 'AST-PR-0002',
                'name' => 'Printer HP LaserJet Pro Lantai 1',
                'category' => 'Periferal',
                'brand' => 'HP',
                'model' => 'LaserJet Pro M404dn',
                'serial_number' => 'HPLJ404D18',
                'purchased_at' => '2022-05-09',
                'assigned_to' => null,
                'status' => Asset::STATUS_MAINTENANCE,
                'notes' => 'Menunggu penggantian roller kertas.',
            ],
            [
                'asset_tag' => 'AST-NW-0001',
                'name' => 'Access Point Ruang Server',
                'category' => 'Jaringan',
                'brand' => 'TP-Link',
                'model' => 'EAP245',
                'serial_number' => 'TPEAP245B09',
                'purchased_at' => '2023-03-01',
                'assigned_to' => null,
                'status' => Asset::STATUS_ACTIVE,
                'notes' => 'Mencakup lantai 1 dan ruang rapat utama.',
            ],
            [
                'asset_tag' => 'AST-MN-0001',
                'name' => 'Monitor LG 24 inci',
                'category' => 'Periferal',
                'brand' => 'LG',
                'model' => '24MP400',
                'serial_number' => 'LG24MP400K5',
                'purchased_at' => '2024-01-18',
                'assigned_to' => $users['karyawan1@helpdesk.test'] ?? null,
                'status' => Asset::STATUS_ACTIVE,
                'notes' => null,
            ],
            [
                'asset_tag' => 'AST-SV-0001',
                'name' => 'Server File Lama',
                'category' => 'Server',
                'brand' => 'Dell',
                'model' => 'PowerEdge R430',
                'serial_number' => 'DEPER430L02',
                'purchased_at' => '2020-07-30',
                'assigned_to' => null,
                'status' => Asset::STATUS_RETIRED,
                'notes' => 'Sudah tidak dipakai, menunggu penghapusan aset.',
            ],
        ];

        foreach ($assets as $asset) {
            Asset::query()->updateOrCreate(
                ['asset_tag' => $asset['asset_tag']],
                $asset,
            );
        }
    }
}
