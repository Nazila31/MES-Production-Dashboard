# MES Laravel Backend

Manufacturing Execution System — Laravel API + frontend statis (`public/`).

> **Git repository** berada di folder **utama project** (`MES_Cleaned_Project - Copy/`), bukan di folder ini.
> Perintah `git status`, `git add`, `git commit`, `git push`, dll. jalankan dari root project.
> Lihat [README.md](../README.md) di root untuk struktur lengkap.

## Requirements

- PHP 8.3+ (disarankan 8.5 via Laragon)
- Composer
- SQLite (default) atau MySQL

## Setup

Dari **root project**, masuk ke folder backend terlebih dahulu:

```powershell
cd "D:\Nazila\MAGANG\MES_Cleaned_Project - Copy\backend"

composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

Open: http://127.0.0.1:8000/login.html

### File uploads (`/storage/...`)

Uploaded files are stored in `storage/app/public/` and served at `/storage/{path}`.

- Run `php artisan storage:link` once (creates `public/storage` symlink), **or** rely on the built-in Laravel route fallback in `routes/web.php`.
- Laragon/Apache document root must point to **`backend/public`**.
- Set `APP_URL` in `.env` to the exact URL you use in the browser (e.g. `http://127.0.0.1:8000`).

Supported upload types: PDF, JPG, JPEG, PNG (max 10 MB).

## Demo Users (password: `password`)

| Role | Email |
|------|-------|
| Admin | admin@mes.local |
| Marketing | marketing@mes.local |
| PPIC | ppic@mes.local |
| Production | production@mes.local |

## API Base

`/api/v1`

## Tests

```powershell
cd "D:\Nazila\MAGANG\MES_Cleaned_Project - Copy\backend"
php artisan test
```

## Git vs Laravel

| Jenis perintah | Jalankan dari |
|----------------|---------------|
| `git status`, `git add`, `git commit`, `git push` | Root project (`MES_Cleaned_Project - Copy/`) |
| `php artisan`, `composer`, `php artisan migrate` | Folder `backend/` |
