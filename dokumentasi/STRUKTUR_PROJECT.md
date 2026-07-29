# Dokumentasi Struktur Project MPMS

**Manufacturing Project Monitoring System v2.0**  
**PT Karya Machindo Industries**

---

## Struktur Folder

```
MPMS/
│
├── backend/                    # Laravel API (PHP 8.3+)
│   ├── app/
│   │   ├── Enums/              # Status & role enums
│   │   ├── Http/Controllers/Api/V1/  # REST API controllers
│   │   ├── Http/Middleware/    # RBAC (EnsureRole)
│   │   ├── Models/             # Eloquent models
│   │   ├── Services/           # Notification, activity log
│   │   └── Support/            # File rules, storage URLs, deadlines
│   ├── config/                 # Laravel + cors.php
│   ├── database/
│   │   ├── migrations/         # Schema database
│   │   └── seeders/            # Demo users & data
│   ├── public/                 # Document root (Laravel + synced frontend)
│   │   ├── index.php           # Laravel entry point
│   │   ├── .htaccess
│   │   ├── index.html          # ← di-sync dari frontend/
│   │   ├── login.html
│   │   ├── assets/             # ← di-sync dari frontend/
│   │   └── pages/              # ← di-sync dari frontend/
│   ├── routes/
│   │   ├── api.php             # API /api/v1/*
│   │   └── web.php             # Storage fallback, redirect /
│   ├── storage/app/public/     # File upload
│   ├── tests/
│   ├── composer.json
│   └── .env.example
│
├── frontend/                   # Source frontend (HTML/CSS/JS)
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── img/
│   ├── pages/
│   ├── index.html
│   ├── login.html
│   ├── package.json
│   └── vite.config.js
│
├── scripts/
│   ├── sync-frontend.js        # Sync frontend → backend/public
│   ├── sync-frontend.ps1
│   └── archive-legacy.js       # Arsip file legacy root
│
├── docs/                       # Guidebook & generator
├── dokumentasi/                # Dokumentasi struktur (file ini)
├── _archive/                   # File legacy (tidak aktif)
│
├── README.md
└── .gitignore
```

---

## Fungsi Setiap Folder

| Folder | Fungsi |
|--------|--------|
| `backend/app/` | Logika bisnis, API controllers, models, services |
| `backend/routes/` | Definisi endpoint API dan web routes |
| `backend/database/` | Migration, seeder, factories |
| `backend/public/` | Document root web server — Laravel + frontend hasil sync |
| `backend/storage/` | Upload file, log, cache, session |
| `frontend/` | **Source of truth** frontend — edit di sini |
| `frontend/assets/js/api/` | Modul fetch API per domain (auth, quotations, dll.) |
| `frontend/assets/js/pages/` | Script khusus per halaman |
| `frontend/pages/` | HTML halaman fitur |
| `scripts/` | Utility sync & maintenance |

---

## Cara Menjalankan Backend

```powershell
cd backend

composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

API tersedia di: `http://127.0.0.1:8000/api/v1`

---

## Cara Menjalankan Frontend

### Mode Development (2 terminal)

**Terminal 1 — Backend:**
```powershell
cd backend
php artisan serve
```

**Terminal 2 — Frontend (Vite dev server):**
```powershell
cd frontend
npm install
npm run dev
```

Buka: `http://127.0.0.1:5173/login.html`

### Mode Production / Single Server

```powershell
cd frontend
npm run build          # sync ke backend/public

cd ../backend
php artisan serve
```

Buka: `http://127.0.0.1:8000/login.html`

---

## Koneksi Frontend ↔ Backend

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Browser        │  HTTP   │  Laravel Backend │         │  MySQL /    │
│  (frontend/)    │ ──────► │  backend/        │ ──────► │  SQLite     │
│                 │  /api/v1│  port 8000       │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

| Aspek | Implementasi |
|-------|-------------|
| API Base | `/api/v1` (relative, same-origin saat sync) |
| Auth | Laravel Sanctum — Bearer token di sessionStorage |
| CORS | `backend/config/cors.php` — untuk dev Vite (:5173) |
| Upload | POST FormData → API → `storage/app/public/` |
| File serve | `/storage/{path}` via web.php fallback |
| RBAC | Middleware `role:` di api.php + `requireAuth()` di frontend |

---

## Workflow Sync Frontend

Setelah mengubah file di `frontend/`:

```powershell
cd frontend
npm run build
```

Script `scripts/sync-frontend.js` menyalin:
- `index.html`, `login.html`
- `assets/`, `pages/`

ke `backend/public/` **tanpa** menimpa `index.php`, `.htaccess`, `storage/`.

---

## Demo Users

Password semua akun: `password`

| Role | Email |
|------|-------|
| Admin | admin@mes.local |
| Marketing | marketing@mes.local |
| PPIC | ppic@mes.local |
| Production | production@mes.local |

---

## Deploy ke Server (Laragon/Apache)

1. Clone project ke server
2. Setup backend (composer, .env, migrate, storage:link)
3. Sync frontend: `cd frontend && npm run build`
4. Set document root Apache/Laragon ke `backend/public`
5. Set `APP_URL` di `.env` sesuai IP/hostname server
6. Akses: `http://IP-SERVER/login.html`

---

## Catatan Git

File di `backend/public/assets/`, `pages/`, `index.html`, `login.html` **tidak di-track** (lihat `.gitignore`).  
Source frontend selalu di folder `frontend/`. Jalankan `npm run build` sebelum deploy.
