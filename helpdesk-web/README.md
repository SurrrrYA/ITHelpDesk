# helpdesk-web

Frontend SPA untuk proyek [IT Helpdesk](../README.md). Dibangun dengan React 19, TypeScript, Vite, dan Tailwind CSS v4.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1
```

Buka `http://localhost:5173`. Backend API harus berjalan di `http://localhost:8000`.

Variabel lingkungan utama:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_REVERB_APP_KEY=<app-key>
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

## Perintah

```bash
npm run dev      # dev server
npm run lint     # oxlint
npm run build    # type check + build produksi (dist/)
npm run preview  # pratinjau hasil build
```

## Dokumentasi

Gambaran fitur, arsitektur, akun demo, dan deployment ada di [`../README.md`](../README.md).
