# progres.md — Catatan Progres IT Helpdesk

> Diperbarui setiap selesai satu pekerjaan. Sesi baru: baca `PRD.md`, `info.md`, lalu file ini.
> AI agent: jangan membuka `.env`. Nilai konfigurasi ada di `info.md`.

Terakhir diperbarui: 2026-11-08

---

## Ringkasan Status

- **Fase saat ini:** Fase 1 (model dan seeder)
- **Sedang dikerjakan:** model + relasi + cast Enum + seeder akun demo
- **Hambatan:** tidak ada

---

## Keputusan yang Sudah Diambil

| Tanggal | Keputusan |
|---|---|
| 2026-11-08 | Proyek untuk portofolio cari kerja, stack Laravel + React + Tailwind |
| 2026-11-08 | Domain proyek: IT Helpdesk / sistem ticketing IT Support |
| 2026-11-08 | Database PostgreSQL, dikelola lewat pgAdmin 4 (server PostgreSQL 18 sudah terpasang dan terhubung) |
| 2026-11-08 | Role: Karyawan, Teknisi IT, Admin. Satu organisasi (tanpa multi-tenant) |
| 2026-11-08 | Arsitektur rencana: Laravel API + React SPA (TypeScript) terpisah, autentikasi Sanctum |
| 2026-11-08 | Status/prioritas/role disimpan sebagai string, divalidasi lewat PHP Enum |
| 2026-11-08 | Paket `helpdesk-db` tidak ditemukan di disk, jadi 9 migration + 3 Enum dibuat ulang langsung di `helpdesk-api` sesuai spesifikasi PRD |
| 2026-11-08 | Ekstensi PHP `pdo_pgsql` dan `pgsql` diaktifkan di `D:\php-8.2.12\php.ini` |

---

## Checklist per Fase

### Fase 0 — Persiapan
- [x] Pilih ide dan domain proyek (2026-11-08)
- [x] Siapkan PostgreSQL + pgAdmin 4 (2026-11-08)
- [x] Rancang ERD dan 9 migration + 3 Enum (paket `helpdesk-db`) (2026-11-08)
- [x] Tulis `PRD.md`, `info.md`, `progres.md` (2026-11-08)
- [x] Buat repo `helpdesk-api` (Laravel 12.12.2) (2026-11-08)
- [x] Buat database `helpdesk` di PostgreSQL (2026-11-08)
- [x] Isi `.env` backend dari template di `info.md` (2026-11-08)
- [x] Buat 9 migration + 3 Enum langsung di proyek Laravel (2026-11-08)
- [x] Jalankan `php artisan migrate`, semua 17 tabel terbentuk (2026-11-08)
- [ ] Buat repo `helpdesk-web` (React + Vite + TypeScript) — menyusul di Fase 4

### Fase 1 — Model dan Seeder
- [ ] Model + relasi: User, Category, SlaPolicy, Asset, Ticket, TicketReply, TicketAttachment, TicketActivity, Article
- [ ] Cast Enum di model (role, status, priority)
- [ ] Seeder: akun demo (lihat `info.md`), kategori, SLA bawaan
- [ ] Factory untuk testing

### Fase 2 — Auth dan Role
- [ ] Pasang Sanctum, endpoint login/logout/me/profil/password
- [ ] Middleware/Policy per role
- [ ] Rate limit login, blokir akun nonaktif

### Fase 3 — API Tiket
- [ ] Form Request + API Resource
- [ ] CRUD tiket, filter, pencarian (`ilike`), paginasi
- [ ] Pembuatan nomor tiket `TKT-YYYYMMDD-NNNN`
- [ ] Hitung batas SLA saat tiket dibuat
- [ ] Penugasan (admin) dan ambil tiket (teknisi)
- [ ] Ubah status sesuai alur + aturan reopen
- [ ] Balasan + catatan internal
- [ ] Lampiran file
- [ ] Pencatatan `ticket_activities`
- [ ] Policy tiket dan balasan

### Fase 4 — Frontend Inti
- [ ] Setup Vite, Tailwind, React Router, klien API
- [ ] Halaman login + protected route + role guard
- [ ] Layout dan menu per role
- [ ] Daftar tiket + filter
- [ ] Buat tiket
- [ ] Detail tiket (balasan, lampiran, riwayat, aksi per role)

### Fase 5 — Master Data dan Dashboard
- [ ] CRUD kategori, SLA, user, aset (admin)
- [ ] Endpoint dan halaman dashboard (Recharts)

### Fase 6 — Real-time, Queue, Scheduler
- [ ] Laravel Reverb + Echo
- [ ] Notifikasi email lewat queue
- [ ] Scheduler: pengingat SLA, auto-close tiket `resolved` 3 hari

### Fase 7 — Fitur Pembeda
- [ ] Inventaris aset terhubung ke tiket
- [ ] Knowledge base + full-text search Postgres

### Fase 8 — Kualitas
- [ ] Test Pest: alur tiket dan policy
- [ ] Laravel Pint
- [ ] GitHub Actions (test + lint)
- [ ] Dokumentasi API (Scribe)

### Fase 9 — Deploy
- [ ] Deploy backend + database
- [ ] Deploy frontend
- [ ] Akun demo live, data dummy
- [ ] README: fitur, screenshot, cara install, ERD

---

## Log Perubahan

Format: `tanggal — apa yang dikerjakan — file yang dibuat/diubah`

- 2026-11-08 — Merancang skema database, membuat migration dan Enum — `helpdesk-db/database/migrations/*` (9 file), `helpdesk-db/app/Enums/{Role,TicketStatus,TicketPriority}.php`, `helpdesk-db/docs/erd.md`
- 2026-11-08 — Membuat dokumen proyek — `PRD.md`, `info.md`, `progres.md`
- 2026-11-08 — Fase 0: aktifkan `pdo_pgsql`/`pgsql` di `php.ini`, buat database `helpdesk`, scaffold Laravel 12, tulis `.env` dari template, buat 9 migration + 3 Enum, migrate sukses, `git init` — `helpdesk-api/.env`, `.env.example`, `.gitignore`, `database/migrations/2026_11_08_000001..000009_*.php`, `app/Enums/{Role,TicketStatus,TicketPriority}.php`

---

## Masalah / Catatan Terbuka

- Belum ada. Tambahkan di sini jika ada error atau hal yang tertunda.

---

## Langkah Berikutnya

1. Fase 1: buat model + relasi untuk 9 tabel, cast Enum (`role`, `status`, `priority`), seeder akun demo/kategori/SLA, dan factory untuk testing.
2. Setelah itu Fase 2: pasang Sanctum dan endpoint auth.
