<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'teknisi1@helpdesk.test')->first()
            ?? User::query()->where('role', 'technician')->first();

        $articles = [
            [
                'slug' => 'laptop-tidak-terhubung-wifi-kantor',
                'title' => 'Langkah awal saat laptop tidak bisa terhubung ke Wi-Fi kantor',
                'excerpt' => 'Cek urutan ini sebelum membuat tiket: tombol Wi-Fi, jaringan yang dipilih, sampai lupa jaringan.',
                'views' => 184,
                'body' => <<<'TEXT'
Masalah Wi-Fi paling sering berasal dari pengaturan di laptop, bukan dari access point. Ikuti urutan berikut sebelum mengirim tiket.

1. Pastikan tombol Wi-Fi atau mode pesawat tidak aktif.
2. Pilih jaringan kantor yang benar. Jaringan tamu biasanya dibatasi dan tidak bisa membuka aplikasi internal.
3. Lupakan jaringan lama, lalu hubungkan ulang dan masukkan password terbaru.
4. Restart laptop. Banyak masalah DHCP selesai setelah restart.
5. Coba laptop lain di lokasi yang sama. Jika laptop lain normal, masalah ada di perangkat Anda.
6. Jika semua perangkat gagal terhubung, kemungkinan access point sedang bermasalah. Buat tiket dengan menyebutkan lokasi, lantai, dan waktu kejadian.

Sertakan tangkapan layar pesan error dan hasil percobaan di atas agar teknisi bisa langsung menindaklanjuti.
TEXT,
            ],
            [
                'slug' => 'reset-password-akun-domain',
                'title' => 'Cara reset password akun domain perusahaan',
                'excerpt' => 'Panduan mengganti password akun domain tanpa mengunci akun Anda sendiri.',
                'views' => 142,
                'body' => <<<'TEXT'
Password akun domain berlaku untuk email, aplikasi internal, dan login ke komputer kantor.

Langkah reset:
1. Buka halaman reset password perusahaan dari browser di jaringan kantor.
2. Masukkan username domain, bukan alamat email lengkap.
3. Ikuti verifikasi yang diminta, lalu buat password baru minimal 12 karakter.
4. Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol. Hindari nama sendiri atau kata yang mudah ditebak.
5. Setelah berhasil, keluar dari semua perangkat lama lalu login ulang.

Jika akun terkunci karena salah password berulang kali, tunggu 15 menit sebelum mencoba lagi. Bila tetap gagal, buat tiket kategori Akun dan Akses. Jangan pernah mengirim password melalui tiket atau chat.
TEXT,
            ],
            [
                'slug' => 'printer-tidak-merespons',
                'title' => 'Printer tidak merespons: lima hal yang perlu dicek',
                'excerpt' => 'Dari kertas macet sampai antrean cetak yang menumpuk, cek ini dulu.',
                'views' => 231,
                'body' => <<<'TEXT'
Sebelum menghubungi tim IT, periksa lima hal berikut pada printer yang tidak merespons.

1. Daya dan koneksi. Pastikan printer menyala dan kabel jaringan atau USB terpasang. Pada printer jaringan, cek lampu indikator jaringan.
2. Kertas dan tinta. Kosongkan tray yang bermasalah, buka penutup untuk memeriksa kertas macet, dan pastikan toner atau tinta masih cukup.
3. Antrean cetak. Buka Settings > Printers, pilih printer, lalu lihat antrean. Hapus dokumen yang menggantung dan coba cetak halaman uji.
4. Printer default. Pastikan printer yang dipilih adalah printer yang benar, bukan printer virtual seperti PDF.
5. Restart. Matikan printer, tunggu 30 detik, lalu nyalakan kembali. Restart juga komputer jika antrean tetap macet.

Jika halaman uji tetap gagal, buat tiket dengan menyebutkan kode aset printer dan lokasi ruangan.
TEXT,
            ],
            [
                'slug' => 'email-tidak-terkirim-outlook',
                'title' => 'Mengatasi email tidak terkirim dari Outlook',
                'excerpt' => 'Periksa folder Outbox, kapasitas mailbox, dan koneksi sebelum membuat tiket.',
                'views' => 98,
                'body' => <<<'TEXT'
Email yang tertahan biasanya berada di folder Outbox. Ikuti langkah ini:

1. Buka folder Outbox dan cek apakah ada pesan yang menggantung. Kirim ulang atau hapus pesan yang gagal.
2. Periksa kapasitas mailbox. Jika hampir penuh, kosongkan item terhapus dan arsipkan email lama.
3. Pastikan ukuran lampiran tidak melebihi batas. Batas umum adalah 25 MB per email, termasuk seluruh lampiran.
4. Tutup Outlook, putuskan lalu sambungkan kembali koneksi jaringan, dan buka Outlook lagi.
5. Coba kirim email tanpa lampiran ke alamat Anda sendiri untuk memastikan jalur pengiriman normal.

Bila pesan error menyebut server menolak koneksi, catat teks error tersebut dan buat tiket kategori Email. Jangan mengirim password email melalui tiket.
TEXT,
            ],
            [
                'slug' => 'panduan-mengajukan-tiket-it',
                'title' => 'Panduan mengajukan tiket IT yang efektif',
                'excerpt' => 'Tiket yang jelas mempercepat penyelesaian. Ini informasi yang dibutuhkan teknisi.',
                'views' => 310,
                'body' => <<<'TEXT'
Tiket yang lengkap membantu teknisi menemukan akar masalah lebih cepat. Sertakan informasi berikut:

- Judul singkat yang menyebutkan masalah utama, misalnya "Laptop restart sendiri saat membuka Excel".
- Deskripsi kronologis: kapan masalah mulai, apa yang dilakukan sebelum muncul, dan apakah bisa diulang.
- Pesan error persis seperti yang tampil di layar, bukan rangkuman.
- Perangkat yang dipakai: kode aset, merek, model, dan sistem operasi.
- Lampiran berupa tangkapan layar, foto perangkat, atau berkas log bila ada.
- Dampak ke pekerjaan: apakah pekerjaan berhenti total atau masih ada jalan lain.

Pilih kategori dan prioritas yang sesuai. Prioritas urgent digunakan hanya bila pekerjaan benar-benar berhenti dan tidak ada alternatif. Hindari membuat tiket ganda untuk masalah yang sama; cukup balas tiket yang sudah ada.
TEXT,
            ],
            [
                'slug' => 'mengenali-email-phishing',
                'title' => 'Cara aman mengenali email phishing',
                'excerpt' => 'Kenali tanda email palsu dan langkah yang harus dilakukan jika sudah terlanjur klik.',
                'views' => 176,
                'body' => <<<'TEXT'
Email phishing sering menyamar sebagai pesan dari bank, vendor, atau tim internal.

Tanda yang perlu diwaspadai:
- Alamat pengirim terlihat mirip, tetapi domainnya berbeda atau memakai tambahan huruf.
- Pesan mendesak meminta Anda segera klik tautan, membayar, atau memasukkan password.
- Tautan mengarah ke situs yang tidak dikenal. Arahkan kursor ke tautan untuk melihat alamat aslinya.
- Lampiran tidak diminta, misalnya invoice atau surat tagihan dalam format zip atau html.
- Salam umum tanpa nama Anda dan banyak kesalahan tata bahasa.

Jika menerima email seperti ini:
1. Jangan klik tautan atau membuka lampiran.
2. Laporkan ke tim IT melalui tiket kategori Keamanan dan sertakan tangkapan layar header email.
3. Hapus email setelah dilaporkan.

Jika sudah terlanjur memasukkan password, segera ganti password dan hubungi IT. Jangan menunggu sampai ada aktivitas mencurigakan.
TEXT,
            ],
        ];

        foreach ($articles as $article) {
            Article::query()->updateOrCreate(
                ['slug' => $article['slug']],
                [
                    ...$article,
                    'user_id' => $author?->id,
                    'is_published' => true,
                    'published_at' => now()->subDays(random_int(1, 40)),
                ],
            );
        }
    }
}
