# github.md — Riwayat Commit

Catatan setiap commit di repositori [IT Helpdesk](https://github.com/SurrrrYA/ITHelpDesk).
Sumber kebenaran tetap `git log`; file ini adalah ringkasan yang mudah dibaca.

- Remote: `https://github.com/SurrrrYA/ITHelpDesk.git`
- Branch: `main`
- Konvensi pesan: `tipe(scope): ringkasan` (`feat`, `fix`, `test`, `ci`, `docs`, `chore`)

---

## Ringkasan

| # | Tanggal | Hash | Commit | Perubahan | File |
|---|---|---|---|---|---|
| 1 | 2026-11-08 | `1973714` | chore: setup awal proyek IT Helpdesk | Scaffold Laravel 12: struktur dasar, konfigurasi, `.gitignore`, `.env.example` | awal repo |
| 2 | 2026-11-08 | `bfe7a67` | chore: setup awal proyek IT Helpdesk | Penyempurnaan setup awal (konfigurasi dasar, model `User`, seeder) | repo awal |
| 3 | 2026-11-11 | `4a466ea` | feat(api): API autentikasi, tiket, master data, dan dashboard | Seluruh backend: auth Sanctum, tiket + SLA + lampiran, master data, dashboard, real-time, queue, scheduler, knowledge base, aset | 102 file, +8.531 / −1.568 |
| 4 | 2026-11-11 | `570d8bd` | test(api): 111 feature test Pest | Pest + database test `helpdesk_test`, 10 file feature test, perbaikan 401 JSON | 15 file, +1.428 / −38 |
| 5 | 2026-11-11 | `7a461b1` | feat(web): SPA React untuk karyawan, teknisi, dan admin | Seluruh frontend: React 19 + TS + Vite + Tailwind v4, login, tiket, dashboard Recharts, master data, knowledge base, aset, real-time Echo | 62 file, +8.639 |
| 6 | 2026-11-11 | `77c7b80` | ci: workflow test backend dan build frontend | GitHub Actions: PHP 8.2 + PostgreSQL 18 (Pest, Pint) dan Node 22 (lint, build) | 1 file, +98 |
| 7 | 2026-11-11 | `0f1d3bd` | docs: README bahasa Indonesia dan panduan per repo | README utama + README `helpdesk-api` dan `helpdesk-web` | 2 file, +395 / −22 |

---

## Rincian

### 3. `4a466ea` — feat(api): API autentikasi, tiket, master data, dan dashboard

- **Auth:** login/logout/me/profil/password dengan Sanctum, middleware `role` dan `active`, rate limit login 5/menit, 401 JSON-only.
- **Tiket:** CRUD, filter/pencarian/paginasi, nomor `TKT-YYYYMMDD-NNNN` (advisory lock), SLA otomatis, assign/take, alur status + reopen, balasan + catatan internal, lampiran, `ticket_activities`.
- **Master data:** kategori, SLA, pengguna, aset (admin), dengan penolakan hapus bila masih dipakai.
- **Dashboard:** `GET /dashboard/summary` dengan scoping per role.
- **Real-time:** Reverb + event `ticket.created`, `reply.created`, `status.changed`, channel `user.{id}`, `queue`, `ticket.{id}`.
- **Queue & scheduler:** email notifikasi queued, `tickets:sla-reminders`, `tickets:auto-close`.
- **Knowledge base & aset:** artikel dengan full-text search PostgreSQL (generated `tsvector` + GIN), riwayat tiket per aset.
- **File utama:** `app/Http/Controllers/Api/V1/*`, `app/Models/*`, `app/Policies/*`, `app/Services/*`, `app/Events/*`, `app/Mail/*`, `app/Console/Commands/*`, `routes/{api,channels,console}.php`, `database/migrations/*`, `database/seeders/*`, `config/{cors,sanctum,reverb,broadcasting}.php`, `bootstrap/app.php`.

### 4. `570d8bd` — test(api): 111 feature test Pest

- Pest 3.8.7 + `pest-plugin-laravel`, database test terpisah `helpdesk_test`.
- Cakupan: auth, tiket, workflow, balasan, policy tiket/artikel, dashboard, master data, artikel/full-text, aset.
- Hasil: **111 test, 251 assertion**.
- **File utama:** `tests/Pest.php`, `tests/TestCase.php`, `tests/Feature/**`, `phpunit.xml`.

### 5. `7a461b1` — feat(web): SPA React untuk karyawan, teknisi, dan admin

- Login + protected route + role guard, layout dan menu per role.
- Daftar tiket + filter, buat tiket + lampiran + aset, detail tiket (balasan, catatan internal, lampiran, riwayat, aksi status).
- Dashboard Recharts, halaman master data admin, knowledge base, riwayat aset.
- Klien API axios dengan token, Echo untuk notifikasi real-time.
- **File utama:** `src/pages/**`, `src/components/**`, `src/contexts/{AuthContext,RealtimeContext}.tsx`, `src/lib/{api,echo,format,labels,cx}.ts`, `src/types/index.ts`, `vite.config.ts`, `package.json`.

### 6. `77c7b80` — ci: workflow test backend dan build frontend

- Job backend: PHP 8.2 + service `postgres:18`, `pint --test`, `php artisan test`.
- Job frontend: Node 22, `npm ci`, `npm run lint`, `npm run build`.
- **File utama:** `.github/workflows/ci.yml`.

### 7. `0f1d3bd` — docs: README bahasa Indonesia dan panduan per repo

- README utama: fitur per role, teknologi, arsitektur, alur tiket, struktur database, keputusan teknis, cara menjalankan, akun demo, testing, deployment.
- README per repo untuk `helpdesk-api` dan `helpdesk-web`.
- **File utama:** `README.md`, `helpdesk-web/README.md`, `helpdesk-api/README.md`.

---

## Commit dokumentasi ini

Commit yang menambahkan `github.md` ini belum tercantum di tabel karena hash-nya baru terbentuk setelah file disimpan. Lihat commit terakhir dengan:

```powershell
git log -1 --stat
```

---

## Cara memperbarui file ini

Setiap kali membuat commit baru:

1. Commit perubahan kode terlebih dahulu.
2. Ambil hash dan pesan commit:
   ```powershell
   $h = git rev-parse --short HEAD
   $m = git log -1 --pretty=%s
   ```
3. Tambahkan baris ke tabel **Ringkasan** dan (bila perlu) bagian **Rincian**.
4. Commit perubahannya:
   ```powershell
   git add github.md
   git commit -m "docs: catat commit $h di github.md"
   ```

Karena sebuah commit tidak bisa mencatat hash-nya sendiri, commit dokumentasi terakhir selalu dicatat pada commit berikutnya.
