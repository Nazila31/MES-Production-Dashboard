# Manufacturing Project Monitoring System (MPMS)

Sistem monitoring proyek manufaktur untuk **PT Karya Machindo Industries**.

**Repository:** https://github.com/Nazila31/MES-Production-Dashboard.git

## Struktur Project

```
MPMS/
├── backend/          # Laravel API (PHP 8.3+)
├── frontend/         # Static HTML/CSS/JS (source frontend)
├── scripts/          # Sync & maintenance scripts
├── docs/             # User guidebook
├── dokumentasi/      # Dokumentasi struktur project
└── README.md
```

| Folder | Fungsi |
|--------|--------|
| `backend/` | Laravel REST API, database, file upload, RBAC |
| `frontend/` | Source frontend — HTML, CSS, JavaScript |
| `backend/public/` | Document root (Laravel + frontend hasil sync) |

> Detail lengkap: [dokumentasi/STRUKTUR_PROJECT.md](dokumentasi/STRUKTUR_PROJECT.md)

---

## Quick Start

### 1. Setup Backend

```powershell
cd backend

composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
```

### 2. Sync Frontend

```powershell
cd frontend
npm install
npm run build
```

### 3. Jalankan

```powershell
cd backend
php artisan serve
```

Buka: **http://127.0.0.1:8000/login.html**

---

## Development (Frontend + Backend Terpisah)

**Terminal 1 — Backend API:**
```powershell
cd backend
php artisan serve
```

**Terminal 2 — Frontend dev server:**
```powershell
cd frontend
npm install
npm run dev
```

Buka: **http://127.0.0.1:5173/login.html**

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

## Git

Perintah Git dijalankan dari **root project**:

```powershell
git status
git add .
git commit -m "pesan commit"
git push origin main
```

Perintah Laravel/Composer dijalankan dari **folder backend/**:

```powershell
cd backend
php artisan migrate
php artisan test
```

---

## API

Base URL: `/api/v1`

---

## Tests

```powershell
cd backend
php artisan test
```

---

## Dokumentasi

- [Struktur Project](dokumentasi/STRUKTUR_PROJECT.md)
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)
- [User Guidebook](docs/MPMS_Implementation_User_Guide_v2.0.docx)
