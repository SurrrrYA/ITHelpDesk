# IT Helpdesk

Aplikasi web untuk mengelola permintaan bantuan IT di sebuah organisasi. Karyawan membuat tiket, tim IT menangani sampai selesai, dan admin memantau kinerja tim lewat dashboard.

Dibangun dengan **Laravel (PHP) sebagai REST API** dan **React (TypeScript) sebagai SPA** yang terpisah. Backend tidak merender HTML sama sekali; seluruh komunikasi memakai JSON.

Jenis aplikasi: **IT Helpdesk / IT Service Management (ITSM)** untuk satu organisasi, menangani *incident* (laporan gangguan) dan *service request* (permintaan layanan). Pembanding di dunia nyata: Zammad, osTicket, Freshservice, GLPI.

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Alur Tiket](#alur-tiket)
- [Struktur Database](#struktur-database)
- [Keputusan Teknis](#keputusan-teknis)
- [Cara Menjalankan](#cara-menjalankan)
- [Akun Demo](#akun-demo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Struktur Repositori](#struktur-repositori)
- [Riwayat Commit](#riwayat-commit)

---

## Fitur

### Karyawan
- Membuat tiket: judul, deskripsi, kategori, prioritas, aset (opsional), dan lampiran.
- Melihat tiket miliknya, memfilter berdasarkan status/prioritas/kategori, dan mencari tiket.
- Membalas tiket, mengunduh lampiran, melihat riwayat aktivitas.
- Menutup tiket dan membuka kembali tiket yang sudah selesai (reopen).
- Membaca knowledge base dan mencari artikel.

### Teknisi IT
- Melihat antrean tiket yang belum ditugaskan serta tiket yang ditugaskan kepadanya.
- Mengambil tiket dari antrean, mengubah status sesuai alur, dan membalas tiket.
- Menulis **catatan internal** yang tidak terlihat oleh karyawan.
- Dashboard ringkas: tiket aktif dan tiket mendekati batas SLA.
- Menulis dan mengubah artikel knowledge base miliknya.

### Admin
- Melihat dan mengelola seluruh tiket, termasuk menugaskan teknisi.
- CRUD master data: kategori, kebijakan SLA, pengguna, dan aset.
- Dashboard analitik: tren 30 hari, distribusi status/prioritas/kategori, ringkasan SLA, beban kerja teknisi, dan tiket yang perlu perhatian.
- Mengelola seluruh artikel knowledge base dan riwayat tiket per aset.

### Lintas fitur
- **Autentikasi token** (Laravel Sanctum), blokir akun nonaktif, rate limit login.
- **Hak akses di backend** lewat Policy dan middleware role, bukan hanya disembunyikan di UI.
- **Nomor tiket otomatis** `TKT-YYYYMMDD-NNNN` dengan PostgreSQL advisory lock.
- **SLA otomatis** dihitung saat tiket dibuat berdasarkan prioritas.
- **Real-time** (Laravel Reverb + Echo): tiket baru, balasan baru, dan perubahan status.
- **Email notifikasi lewat queue** (driver database).
- **Scheduler**: pengingat SLA tiap 15 menit dan auto-close tiket selesai yang didiamkan 3 hari.
- **Knowledge base** dengan full-text search PostgreSQL.
- **Inventaris aset** yang terhubung ke tiket beserta riwayatnya.
- **Lampiran** gambar (jpg, png, webp) dan PDF, maksimal 5 MB per file dan 5 file per tiket/balasan.

---

## Teknologi

| Lapisan | Teknologi | Kegunaan |
|---|---|---|
| Bahasa backend | PHP 8.2 | Logika server |
| Framework backend | Laravel 12 | REST API, Eloquent, validasi, queue, scheduler |
| Autentikasi | Laravel Sanctum | Token Bearer untuk SPA |
| Database | PostgreSQL 18 | Data relasional, full-text search, JSONB |
| WebSocket | Laravel Reverb | Notifikasi real-time |
| Frontend | React 19 + TypeScript | Antarmuka SPA |
| Build tool | Vite 8 | Dev server dan bundling |
| Routing | React Router 7 | Routing dan protected route per role |
| Styling | Tailwind CSS v4 | UI flat, tanpa gradien |
| HTTP client | axios | Memanggil API dan menyisipkan token |
| Grafik | Recharts 3 | Dashboard analitik |
| Real-time client | laravel-echo + pusher-js | Berlangganan channel privat |
| Testing | Pest 3 (di atas PHPUnit) | 111 test / 251 assertion |
| Formatter | Laravel Pint | Standar kode PHP |

Angka singkat: **40 endpoint API** di prefix `/api/v1`, **18 tabel**, **9 model domain**.

> Catatan istilah: React dan Laravel adalah *framework*; bahasa pemrogramannya TypeScript/JavaScript dan PHP.

---

## Arsitektur

```
React SPA (TypeScript)  --HTTP/JSON + Bearer token-->  Laravel API
        |                                                   |
        +--WebSocket (Reverb, channel privat)<--------------+
                                                            +-- PostgreSQL
                                                            +-- Queue (database) -> email
                                                            +-- Scheduler -> SLA reminder, auto-close
```

- `helpdesk-api` — Laravel, hanya mengembalikan JSON lewat API Resource.
- `helpdesk-web` — React SPA, memanggil API memakai axios dengan token Sanctum.
- Channel real-time: `private-user.{id}`, `private-queue`, `private-ticket.{id}`.
- Autentikasi channel memakai `POST /broadcasting/auth` dengan Bearer token.

---

## Alur Tiket

1. Karyawan login, lalu membuat tiket (kategori, prioritas, aset, lampiran).
2. Sistem membuat nomor tiket `TKT-YYYYMMDD-NNNN` dan menghitung batas SLA.
3. Teknisi menerima notifikasi real-time, mengambil tiket dari antrean, lalu membalas.
4. Status bergerak: `new` → `assigned` → `in_progress` → `resolved` → `closed`.
5. Karyawan dapat membuka kembali tiket `resolved` (reopen).
6. Scheduler menutup otomatis tiket `resolved` yang tidak direspons karyawan selama 3 hari.
7. Setiap perubahan penting dicatat di `ticket_activities` (termasuk nilai lama dan baru).

**SLA bawaan:**

| Prioritas | Respons pertama | Penyelesaian |
|---|---|---|
| urgent | 15 menit | 4 jam |
| high | 1 jam | 8 jam |
| medium | 4 jam | 24 jam |
| low | 8 jam | 72 jam |

---

## Struktur Database

18 tabel: 9 tabel domain dan 9 tabel infrastruktur Laravel.

**Tabel domain:**

| Tabel | Isi |
|---|---|
| `users` | Pengguna + role (`employee`, `technician`, `admin`), telepon, departemen, status aktif |
| `categories` | Kategori tiket |
| `sla_policies` | Kebijakan SLA per prioritas |
| `assets` | Inventaris aset dan penugasan ke pengguna |
| `tickets` | Tiket + status, prioritas, SLA, penugasan, aset |
| `ticket_replies` | Balasan dan catatan internal |
| `ticket_attachments` | Lampiran tiket/balasan |
| `ticket_activities` | Riwayat aktivitas (kolom `properties` JSONB) |
| `articles` | Knowledge base + kolom generated `search_vector` (tsvector) |

**Tabel infrastruktur:** `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `migrations`, `password_reset_tokens`, `personal_access_tokens`, `sessions`.

---

## Keputusan Teknis

1. **Nomor tiket memakai PostgreSQL advisory lock.** Aman dari race condition saat banyak tiket dibuat bersamaan, berbeda dari pendekatan `count() + 1` yang bisa menghasilkan nomor duplikat.
2. **Full-text search memakai generated `tsvector` + GIN index** (`articles.search_vector`, konfigurasi `simple`) dengan `plainto_tsquery`, ditambah fallback `ilike` untuk potongan kata.
3. **Event dan email lewat queue**, dengan `queue:work` dan `schedule:work` sebagai proses terpisah agar request API tetap cepat.
4. **API murni JSON.** Permintaan tanpa autentikasi selalu mendapat 401 JSON, tidak pernah redirect ke halaman login.
5. **Hak akses ditegakkan di backend** lewat Policy dan middleware, sehingga tidak bisa diakali dari sisi frontend.
6. **Hapus master data ditolak bila masih dipakai** (kategori/aset punya tiket, pengguna punya riwayat); admin diarahkan menonaktifkan atau me-retire data tersebut.

---

## Cara Menjalankan

### Prasyarat

| Kebutuhan | Versi |
|---|---|
| PHP | 8.2+ dengan ekstensi `pdo_pgsql` dan `pgsql` |
| Composer | 2.x |
| Node.js / npm | 20+ / 10+ |
| PostgreSQL | 14+ (dikembangkan di 18) |

### 1. Backend

```bash
cd helpdesk-api
composer install
cp .env.example .env
php artisan key:generate
```

Isi kredensial database di `.env`, lalu:

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

Jalankan API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 2. Frontend

```bash
cd helpdesk-web
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1
```

Buka `http://localhost:5173`.

### 3. Proses pendukung (terminal terpisah)

| Proses | Perintah | Fungsi |
|---|---|---|
| API | `php artisan serve` | Server HTTP |
| Reverb | `php artisan reverb:start` | WebSocket real-time |
| Queue | `php artisan queue:work --tries=3` | Email dan event |
| Scheduler | `php artisan schedule:work` | Pengingat SLA dan auto-close |
| Frontend | `npm run dev` | Vite dev server |

### 4. Build produksi frontend

```bash
cd helpdesk-web
npm run build
```

Hasil build ada di `helpdesk-web/dist`.

### Variabel lingkungan penting

Backend (`.env`):

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=helpdesk
QUEUE_CONNECTION=database
BROADCAST_CONNECTION=reverb
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
```

Frontend (`.env`):

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_REVERB_APP_KEY=<app-key>
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Nilai rahasia (password database, `APP_KEY`, secret Reverb, kredensial SMTP/penyimpanan) tidak disimpan di repositori ini.

---

## Akun Demo

Dibuat oleh seeder. Hanya untuk pengembangan dan demo.

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@helpdesk.test` | `Admin#12345` |
| Teknisi IT | `teknisi1@helpdesk.test` | `Teknisi#12345` |
| Teknisi IT | `teknisi2@helpdesk.test` | `Teknisi#12345` |
| Karyawan | `karyawan1@helpdesk.test` | `Karyawan#12345` |
| Karyawan | `karyawan2@helpdesk.test` | `Karyawan#12345` |

Data demo tambahan: 6 kategori, 4 kebijakan SLA, 8 aset, dan 6 artikel knowledge base.

> Ganti seluruh password demo sebelum dipakai publik.

---

## Testing

Test memakai database terpisah `helpdesk_test` (PostgreSQL), bukan database pengembangan.

```bash
cd helpdesk-api
php artisan test
```

Hasil terakhir: **111 test, 251 assertion, semua lulus**.

Cakupan: autentikasi, CRUD tiket, alur status dan penugasan, balasan dan catatan internal, policy tiket dan artikel, dashboard per role, master data admin, pencarian artikel (full-text), serta aset dan riwayatnya.

Format kode:

```bash
cd helpdesk-api
./vendor/bin/pint
```

---

## Deployment

Rekomendasi pembagian layanan:

| Komponen | Layanan |
|---|---|
| Frontend SPA | Vercel |
| Laravel API | Railway / Render / Fly.io |
| Reverb, queue worker, scheduler | Railway (service terpisah) |
| PostgreSQL | Railway / Neon / Supabase |
| Lampiran | Cloudflare R2 atau S3 |
| Email | Resend / Brevo (SMTP) |

Laravel tidak dapat dijalankan penuh di Vercel karena serverless tidak mendukung proses persisten (WebSocket, queue, scheduler) dan filesystem-nya sementara.

Langkah ringkas:

1. Deploy backend + database, jalankan `php artisan migrate --force` lalu seeder.
2. Deploy Reverb, `queue:work`, dan `schedule:work` sebagai service terpisah.
3. Pindahkan lampiran ke R2/S3 dan email ke SMTP.
4. Deploy frontend ke Vercel dengan `VITE_API_URL` dan variabel Reverb yang benar.
5. Tambahkan domain frontend ke `CORS_ALLOWED_ORIGINS` (dan pola preview Vercel bila perlu).
6. Pastikan `APP_DEBUG=false` dan seluruh koneksi memakai HTTPS.

Detail konfigurasi dan nilai rahasia disimpan terpisah di dokumen internal, tidak di repositori.

---

## Struktur Repositori

```
ITHelpDesk/
├── helpdesk-api/            # Laravel REST API
│   ├── app/
│   │   ├── Console/Commands/    # tickets:sla-reminders, tickets:auto-close
│   │   ├── Enums/               # Role, TicketStatus, TicketPriority
│   │   ├── Events/              # Event broadcast real-time
│   │   ├── Http/Controllers/Api/V1/
│   │   ├── Http/Requests/       # Validasi
│   │   ├── Http/Resources/      # Bentuk response JSON
│   │   ├── Mail/                # Email notifikasi
│   │   ├── Models/
│   │   ├── Policies/
│   │   └── Services/            # TicketService, TicketNumberService
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/                  # api.php, channels.php, console.php
│   └── tests/                   # Pest feature test
├── helpdesk-web/            # React SPA
│   ├── src/
│   │   ├── components/          # UI dan layout
│   │   ├── contexts/            # Auth, Realtime
│   │   ├── lib/                 # api, echo, format, labels
│   │   ├── pages/               # Halaman per role
│   │   └── types/
│   └── vite.config.ts
├── PRD.md                   # Kebutuhan produk
├── progres.md               # Catatan progres
└── README.md
```

---

## Status Proyek

Proyek portofolio. Seluruh fitur MVP dan fase lanjutan sudah berjalan dan teruji secara lokal, dengan CI GitHub Actions untuk backend (Pest + Pint) dan frontend (lint + build). Yang belum dikerjakan: dokumentasi API (Scribe) dan deployment publik.

---

## Riwayat Commit

Catatan setiap commit dan perubahannya ada di [`github.md`](github.md).
