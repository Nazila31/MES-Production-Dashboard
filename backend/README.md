# MES Laravel Backend

Manufacturing Project Monitoring System — Laravel REST API.

> **Git repository** berada di folder **utama project** (root), bukan di folder ini.  
> Frontend source ada di `../frontend/` — sync ke `public/` via `npm run build`.

## Requirements

- PHP 8.3+ (disarankan 8.5 via Laragon)
- Composer
- SQLite (default dev) atau MySQL (production)

## Setup

```powershell
cd backend

composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
```

Sync frontend sebelum serve:

```powershell
cd ../frontend
npm install
npm run build
```

Jalankan server:

```powershell
cd ../backend
php artisan serve
```

Open: http://127.0.0.1:8000/login.html

## API

Base URL: `/api/v1`

Controllers: `app/Http/Controllers/Api/V1/`

| Controller | Domain |
|------------|--------|
| AuthController | Login, logout, me |
| DashboardController | KPI per role |
| QuotationController | Quotation CRUD, follow-up, approve/reject |
| SalesOrderController | SO CRUD, deadlines, delivery note |
| PpicController | BOM, warehouse, work order, schedule |
| ProductionController | Stages, QC, shipment |
| ReportController | Reports, CSV/PDF export |
| NotificationController | Notifications |

## File Uploads

- Storage: `storage/app/public/`
- Served at: `/storage/{path}` (symlink or web.php fallback)
- Types: PDF, JPG, JPEG, PNG (max 10 MB)
- Set `APP_URL` in `.env` to exact browser URL

## CORS (Frontend Dev Server)

When frontend runs on Vite (:5173) and API on :8000, CORS is configured in `config/cors.php`.  
Production (synced to public/) uses same origin — no CORS needed.

## Tests

```powershell
php artisan test
```

## Git vs Laravel

| Perintah | Jalankan dari |
|----------|---------------|
| `git status`, `git commit`, `git push` | Root project |
| `php artisan`, `composer` | Folder `backend/` |
| `npm run dev`, `npm run build` | Folder `frontend/` |
