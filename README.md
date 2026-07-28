# MES Production Dashboard

Manufacturing Project Monitoring System (MPMS) — monorepo untuk backend Laravel dan frontend statis.

**Repository GitHub:** https://github.com/Nazila31/MES-Production-Dashboard.git

## Struktur Project

```
MES_Cleaned_Project - Copy/     ← Root Git repository
├── backend/                    ← Laravel API + frontend statis (public/)
├── frontend/                   ← Frontend legacy/referensi (jika ada)
├── .vscode/
└── CLEANUP_REPORT.md
```

| Path | Fungsi |
|------|--------|
| `D:\Nazila\MAGANG\MES_Cleaned_Project - Copy` | **Root Git** — jalankan semua perintah Git di sini |
| `...\backend` | **Laravel** — jalankan `php artisan`, `composer`, dll. di sini |
| `...\frontend` | Frontend terpisah (jika digunakan) |

## Git (dari root project)

Semua perintah Git dijalankan dari folder utama, **bukan** dari `backend/`:

```powershell
cd "D:\Nazila\MAGANG\MES_Cleaned_Project - Copy"

git status
git add .
git commit -m "pesan commit"
git push origin main
```

## Setup Backend (dari folder `backend`)

```powershell
cd "D:\Nazila\MAGANG\MES_Cleaned_Project - Copy\backend"

composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

Buka: http://127.0.0.1:8000/login.html

## Demo Users

Password semua akun: `password`

| Role | Email |
|------|-------|
| Admin | admin@mes.local |
| Marketing | marketing@mes.local |
| PPIC | ppic@mes.local |
| Production | production@mes.local |

## API

Base URL: `/api/v1`

## Tests

```powershell
cd "D:\Nazila\MAGANG\MES_Cleaned_Project - Copy\backend"
php artisan test
```

## Catatan

- Root Git repository ada di folder **utama project**, bukan di `backend/`.
- Frontend aktif untuk aplikasi berjalan berada di `backend/public/` (disajikan oleh Laravel).
- Detail setup backend: lihat [backend/README.md](backend/README.md).
