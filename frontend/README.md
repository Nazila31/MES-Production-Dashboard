# MPMS Frontend

Static frontend untuk Manufacturing Project Monitoring System — HTML, CSS, JavaScript (tanpa framework).

## Struktur

```
frontend/
├── index.html          # Dashboard Admin
├── login.html          # Halaman login
├── assets/
│   ├── css/            # Stylesheet global & per-modul
│   ├── js/
│   │   ├── api/        # HTTP client & modul API per domain
│   │   ├── components/ # Layout, navbar, sidebar
│   │   ├── config/     # app.config.js (navigasi, status, workflow)
│   │   ├── pages/      # Script per halaman
│   │   └── utils/      # path, format, charts, constants
│   └── img/            # Logo, avatar, ikon
├── pages/              # Halaman fitur per modul
│   ├── dashboard/
│   ├── quotations/
│   ├── sales-orders/
│   ├── ppic/
│   ├── production/
│   ├── reports/
│   └── notifications/
├── package.json
└── vite.config.js
```

## Development (Frontend + Backend terpisah)

Terminal 1 — Backend API:

```powershell
cd backend
php artisan serve
# → http://127.0.0.1:8000
```

Terminal 2 — Frontend dev server (Vite + proxy API):

```powershell
cd frontend
npm install
npm run dev
# → http://127.0.0.1:5173/login.html
```

Vite mem-proxy `/api` dan `/storage` ke Laravel (:8000), sehingga auth dan upload tetap berfungsi.

## Production / Single Server

Sync frontend ke `backend/public/` lalu jalankan Laravel:

```powershell
cd frontend
npm run build          # sync ke backend/public

cd ../backend
php artisan serve
# → http://127.0.0.1:8000/login.html
```

## Koneksi API

- Default: `apiBaseUrl: "/api/v1"` di `assets/js/config/app.config.js`
- Override via meta tag di HTML: `<meta name="mpms-api-base" content="http://127.0.0.1:8000/api/v1">`
- Auth: Bearer token di `sessionStorage` (Sanctum)
