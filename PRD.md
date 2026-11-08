# PRD — IT Helpdesk (Sistem Ticketing IT Support)

Versi: 1.0 | Tanggal: 8 November 2026 | Pemilik: Surya

---

## 0. ATURAN WAJIB UNTUK AI AGENT (BACA PERTAMA)

Dokumen ini dipakai sebagai instruksi untuk AI coding agent (Claude Code, opencode, dll.). Ikuti aturan ini di setiap sesi:

1. **Awal sesi:** baca `PRD.md`, `info.md`, dan `progres.md`, berurutan, sebelum menulis kode apa pun.
2. **Jangan pernah membuka, membaca, atau menampilkan isi file `.env`** (backend maupun frontend). File itu berisi rahasia.
   - Semua nilai konfigurasi yang dibutuhkan ada di `info.md`, bagian "Template .env".
   - Untuk mengisi `.env`, **tulis ulang seluruh file** dari template di `info.md` (overwrite). Jangan membaca isi lamanya, jangan `cat .env`, jangan `grep` ke `.env`.
   - Kalau butuh variabel baru, tambahkan ke template di `info.md` dan `.env.example`, lalu tulis ulang `.env` dari template itu.
3. **Setiap selesai satu pekerjaan** (satu fitur, satu migration, satu endpoint, satu halaman, satu bug fix), **perbarui `progres.md`**: centang tugasnya, tulis tanggal, tulis file yang dibuat/diubah, dan isi "Langkah berikutnya". Jangan menunda sampai akhir sesi.
4. **Akhir sesi:** pastikan `progres.md` sudah mencerminkan kondisi terakhir proyek, supaya sesi berikutnya bisa langsung lanjut.
5. Jika `info.md` atau `progres.md` belum ada, buat dari struktur yang dijelaskan di bagian 12 dokumen ini.
6. Berikan file kode **lengkap per file**, bukan potongan.
7. Jangan menjalankan `migrate:fresh`, `db:wipe`, atau perintah penghapus data tanpa konfirmasi dari Surya.
8. `info.md` berisi password. Pastikan `info.md` masuk `.gitignore` dan tidak pernah di-commit.
9. Komunikasi dalam Bahasa Indonesia.

---

## 1. Ringkasan Produk

IT Helpdesk adalah aplikasi web untuk mengelola permintaan bantuan IT (laporan masalah dan permintaan layanan) di sebuah organisasi, misalnya kantor atau kampus. Karyawan membuat tiket, tim IT menangani sampai selesai, dan admin memantau kinerja lewat dashboard.

**Tujuan proyek:** portofolio untuk melamar kerja di bidang IT. Karena itu proyek harus rapi, teruji, bisa dicoba secara live, dan menunjukkan kemampuan di luar CRUD biasa (role/permission, real-time, queue, scheduler, testing, CI/CD).

## 2. Masalah yang Diselesaikan

- Laporan lewat chat atau lisan mudah terlewat.
- Tidak jelas siapa yang menangani dan sudah sampai mana.
- Tidak ada data untuk menilai kecepatan dan kinerja tim IT.
- Tidak ada riwayat masalah berulang yang bisa dijadikan panduan mandiri.

## 3. Sasaran dan Indikator Keberhasilan

| Sasaran | Indikator |
|---|---|
| Alur tiket end-to-end berjalan | Karyawan buat tiket → teknisi tangani → selesai → ditutup, tanpa error |
| Akses terkontrol per role | Semua endpoint dilindungi policy, diuji otomatis |
| Layak jadi portofolio | Demo live, akun demo, README + screenshot, ERD, dokumentasi API |
| Kualitas kode | Test (Pest/PHPUnit) lulus, CI GitHub Actions hijau |

## 4. Pengguna dan Role

| Role | Nilai di DB | Deskripsi |
|---|---|---|
| Karyawan | `employee` | Pelapor. Membuat dan memantau tiket miliknya |
| Teknisi IT | `technician` | Menangani tiket yang ditugaskan |
| Admin | `admin` | Mengelola pengguna, master data, melihat semua tiket dan laporan |

### Matriks hak akses

| Aksi | Karyawan | Teknisi | Admin |
|---|---|---|---|
| Buat tiket | ✅ | ✅ | ✅ |
| Lihat tiket | Miliknya saja | Yang ditugaskan + antrean | Semua |
| Balas tiket | Tiket miliknya | Tiket yang ditangani | Semua |
| Catatan internal (`is_internal`) | ❌ | ✅ | ✅ |
| Ambil tiket dari antrean | ❌ | ✅ | ✅ |
| Tugaskan/ubah teknisi | ❌ | ❌ | ✅ |
| Ubah status | Tutup / buka kembali tiket miliknya | Sesuai alur | Semua |
| Kelola kategori, SLA, user, aset | ❌ | ❌ | ✅ |
| Dashboard analitik | ❌ | Ringkas (miliknya) | Penuh |
| Baca knowledge base | ✅ | ✅ | ✅ |
| Tulis artikel knowledge base | ❌ | ✅ | ✅ |

## 5. Ruang Lingkup

### 5.1 MVP (wajib selesai)
- Autentikasi (login, logout, profil) dan role/permission
- CRUD tiket + lampiran gambar
- Alur status dan penugasan
- Balasan, catatan internal, riwayat aktivitas
- Kategori, prioritas, SLA
- Dashboard dasar

### 5.2 Fase 2 (pembeda portofolio)
- Notifikasi real-time (Laravel Reverb)
- Email notifikasi lewat queue
- Scheduler: pengingat SLA, auto-close
- Inventaris aset terhubung ke tiket
- Knowledge base
- Dashboard analitik penuh (grafik)

### 5.3 Di luar lingkup
- Multi-tenant
- Aplikasi mobile
- Integrasi chat (WhatsApp/Telegram)
- Pembayaran

## 6. Aturan Bisnis

**Nomor tiket:** format `TKT-YYYYMMDD-NNNN` (urut per hari, contoh `TKT-20261108-0001`).

**Alur status** (nilai di DB → label):
`new` (Baru) → `assigned` (Ditugaskan) → `in_progress` (Diproses) → `resolved` (Selesai) → `closed` (Ditutup)

- `resolved` boleh kembali ke `in_progress` jika karyawan membuka kembali (reopen).
- Tiket `closed` tidak bisa diubah lagi.
- Tiket `new` tanpa penugasan boleh diambil teknisi sendiri (jadi `assigned`).
- `first_response_at` terisi saat balasan pertama dari teknisi/admin (bukan internal).
- `resolved_at` terisi saat status `resolved`; `closed_at` saat `closed`.

**Prioritas:** `low`, `medium`, `high`, `urgent`.

**SLA bawaan (seed):**

| Prioritas | Respons pertama | Penyelesaian |
|---|---|---|
| urgent | 15 menit | 4 jam |
| high | 1 jam | 8 jam |
| medium | 4 jam | 24 jam |
| low | 8 jam | 72 jam |

`sla_response_due_at` dan `sla_resolution_due_at` dihitung saat tiket dibuat (waktu dibuat + durasi SLA prioritasnya). Perhitungan memakai menit kalender biasa (jam kerja bisa jadi pengembangan lanjut).

**Auto-close:** tiket `resolved` yang tidak ada respons dari karyawan selama 3 hari menjadi `closed` otomatis lewat scheduler.

**Lampiran:** gambar (jpg, png, webp) dan pdf, maksimal 5 MB per file, maksimal 5 file per tiket/balasan.

**Setiap perubahan penting** (buat tiket, ganti status, tugaskan, balas, ganti prioritas) dicatat ke `ticket_activities` (kolom `properties` jsonb menyimpan nilai lama → baru).

## 7. Kebutuhan Fungsional

### 7.1 Autentikasi
- Login email + password, logout.
- Token API lewat Laravel Sanctum.
- Endpoint profil: lihat dan ubah nama, telepon, departemen, password.
- Akun nonaktif (`is_active = false`) tidak bisa login.
- Registrasi mandiri tidak ada; akun dibuat Admin.

### 7.2 Tiket
- Karyawan membuat tiket: judul, deskripsi, kategori, prioritas, aset (opsional), lampiran.
- Daftar tiket dengan filter (status, prioritas, kategori, teknisi), pencarian (`ilike` judul/nomor), dan paginasi.
- Detail tiket: info, lampiran, balasan, riwayat aktivitas.
- Penugasan dan perubahan status sesuai matriks akses.

### 7.3 Balasan
- Semua pihak yang berhak bisa membalas dan melampirkan file.
- Teknisi/admin bisa menandai balasan sebagai catatan internal (tidak terlihat karyawan).

### 7.4 Master data (Admin)
- CRUD kategori, kebijakan SLA, pengguna, aset.

### 7.5 Dashboard
- Admin: jumlah tiket per status, per prioritas, per kategori; rata-rata waktu respons dan penyelesaian; tiket melewati SLA; beban kerja tiap teknisi; tren tiket 30 hari.
- Teknisi: tiket aktif miliknya, tiket mendekati batas SLA.
- Karyawan: ringkasan tiket miliknya.

### 7.6 Fase 2
- **Real-time:** event tiket baru, balasan baru, perubahan status lewat Laravel Reverb + Laravel Echo.
- **Email:** notifikasi lewat queue (driver database).
- **Scheduler:** pengingat tiket mendekati batas SLA, auto-close.
- **Aset:** daftar aset, penugasan ke pengguna, riwayat tiket per aset.
- **Knowledge base:** artikel publik internal dengan pencarian (Postgres full-text search).

## 8. Kebutuhan Non-Fungsional

- **Keamanan:** hak akses dicek di backend lewat Policy, bukan hanya disembunyikan di frontend. Validasi lewat Form Request. Password di-hash. Rate limit pada login.
- **Performa:** daftar tiket dipaginasi dan memakai indeks yang sudah ada di migration; hindari N+1 (eager loading).
- **Kualitas:** test otomatis untuk alur utama dan policy; format kode dengan Laravel Pint.
- **Responsif:** tampilan nyaman di desktop dan HP.
- **Bahasa antarmuka:** Indonesia.

## 9. Teknologi

| Lapisan | Pilihan |
|---|---|
| Backend | PHP, Laravel (REST API) |
| Autentikasi | Laravel Sanctum |
| Frontend | React + TypeScript (Vite), React Router |
| Styling | Tailwind CSS |
| Database | PostgreSQL 18 (dikelola lewat pgAdmin 4) |
| Real-time | Laravel Reverb + Laravel Echo |
| Queue | Database queue |
| Grafik | Recharts |
| Testing | Pest/PHPUnit |
| Dokumentasi API | Scribe |
| CI/CD | GitHub Actions |

Arsitektur: dua repo terpisah, `helpdesk-api` (Laravel) dan `helpdesk-web` (React SPA). Backend hanya mengembalikan JSON lewat API Resource.

## 10. Data

Skema database dan ERD sudah dibuat di paket `helpdesk-db` (9 migration, 3 PHP Enum, `docs/erd.md`).

Tabel: `users` (+ kolom role, phone, department, is_active), `categories`, `sla_policies`, `assets`, `tickets`, `ticket_replies`, `ticket_attachments`, `ticket_activities`, `articles`.

Enum PHP: `Role`, `TicketStatus`, `TicketPriority` (di `app/Enums`).

## 11. Rancangan API (prefix `/api/v1`)

**Auth:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password`

**Tiket:**
- `GET /tickets`, `POST /tickets`, `GET /tickets/{id}`, `PUT /tickets/{id}`
- `POST /tickets/{id}/assign` (admin), `POST /tickets/{id}/take` (teknisi)
- `POST /tickets/{id}/status`
- `GET /tickets/{id}/replies`, `POST /tickets/{id}/replies`
- `GET /tickets/{id}/activities`
- `POST /tickets/{id}/attachments`

**Master data (admin):** `/categories`, `/sla-policies`, `/users`, `/assets` (CRUD)

**Dashboard:** `GET /dashboard/summary`, `GET /dashboard/workload`, `GET /dashboard/trend`

**Knowledge base:** `GET /articles`, `GET /articles/{slug}`, `POST/PUT/DELETE /articles` (teknisi/admin)

## 12. Halaman Frontend

| Role | Halaman |
|---|---|
| Semua | Login, Profil |
| Karyawan | Tiket saya, Buat tiket, Detail tiket, Knowledge base |
| Teknisi | Antrean tiket, Tiket ditugaskan, Detail tiket (ubah status, catatan internal), Dashboard ringkas, Knowledge base |
| Admin | Dashboard penuh, Semua tiket, Kelola user, kategori, SLA, aset, artikel |

Satu aplikasi React, satu halaman login, menu dan rute dibatasi lewat protected route dan role guard (berdasarkan role dari `/auth/me`). Komponen detail tiket dipakai bersama; yang berbeda hanya aksinya.

## 13. Struktur File Pendamping

### `info.md` (jangan di-commit)
Berisi: akun demo (email + password per role), template `.env` backend dan frontend, perintah setup. Dipakai agent sebagai satu-satunya sumber nilai konfigurasi.

### `progres.md`
Berisi: ringkasan status, checklist per fase dengan tanggal, log perubahan (apa yang dibuat/diubah), keputusan teknis, masalah yang belum selesai, dan "Langkah berikutnya". Diperbarui setiap selesai satu pekerjaan.

## 14. Rencana Pengerjaan

| Fase | Isi | Hasil |
|---|---|---|
| 0 | Persiapan: repo, database `helpdesk`, migrasi | Tabel terbentuk |
| 1 | Model + relasi, seeder (akun demo, kategori, SLA) | Data awal siap |
| 2 | Auth + role/policy | Login per role berfungsi |
| 3 | API tiket, balasan, aktivitas, lampiran | Alur inti jalan di API |
| 4 | Frontend: auth, layout, tiket | Alur inti jalan di UI |
| 5 | Master data + dashboard | Admin bisa kelola dan memantau |
| 6 | Real-time, queue, scheduler | Notifikasi dan otomasi |
| 7 | Aset + knowledge base | Fitur pembeda |
| 8 | Testing, CI/CD, dokumentasi API | Kualitas terjamin |
| 9 | Deploy, akun demo live, README + screenshot | Siap dipamerkan |

## 15. Kriteria Penerimaan MVP

- Tiap role bisa login dan hanya melihat menu serta data sesuai haknya.
- Karyawan membuat tiket dengan lampiran; tiket mendapat nomor dan batas SLA otomatis.
- Teknisi mengambil/ditugaskan tiket, mengubah status sesuai alur, membalas, dan menulis catatan internal yang tidak terlihat karyawan.
- Setiap perubahan tercatat di riwayat aktivitas.
- Admin mengelola master data dan melihat dashboard.
- Test untuk alur utama dan policy lulus.

## 16. Risiko

| Risiko | Penanganan |
|---|---|
| Ruang lingkup melebar | Kerjakan MVP sampai tuntas dulu, fase 2 menyusul |
| Real-time sulit di-deploy | Siapkan fallback polling jika Reverb bermasalah di hosting |
| Proyek berhenti di tengah | `progres.md` selalu diperbarui supaya mudah dilanjutkan |
| Rahasia bocor | `.env` dan `info.md` masuk `.gitignore`, hanya `.env.example` yang di-commit |
