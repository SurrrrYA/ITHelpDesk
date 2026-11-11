# helpdesk-api

Backend REST API untuk proyek [IT Helpdesk](../README.md). Dibangun dengan Laravel 12 dan PostgreSQL.

## Menjalankan

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

Proses pendukung:

```bash
php artisan reverb:start          # WebSocket real-time
php artisan queue:work --tries=3  # email dan event
php artisan schedule:work         # pengingat SLA dan auto-close
```

## Testing dan format kode

```bash
php artisan test
./vendor/bin/pint
```

Test memakai database PostgreSQL terpisah `helpdesk_test` (lihat `phpunit.xml`).

## Dokumentasi

- Gambaran fitur, arsitektur, dan cara menjalankan seluruh proyek: [`../README.md`](../README.md)
- Ringkasan endpoint: `routes/api.php` (prefix `/api/v1`)
