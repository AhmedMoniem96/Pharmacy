# Pharmacy Management System (MVP)

Production-ready foundation for a multi-tenant pharmacy ERP (POS, inventory, purchasing, accounting, reports, compliance).

## Backend setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (optional) or use defaults:

```bash
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=*
DJANGO_TIME_ZONE=UTC
CORS_ALLOW_ALL=true
JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=7
```

Run migrations and start the server:

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

## Authentication (JWT)

Obtain a token:

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Refresh a token:

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

## API endpoints

- `GET /api/health/` — health check
- `POST /api/auth/token/` — obtain JWT access/refresh tokens
- `POST /api/auth/token/refresh/` — refresh access token
- `GET /api/accounts/me/` — current user profile + company scope

Master data:
- `/api/masterdata/companies/` (superuser only)
- `/api/masterdata/branches/`
- `/api/masterdata/warehouses/`
- `/api/masterdata/categories/`
- `/api/masterdata/manufacturers/`
- `/api/masterdata/products/`

Inventory:
- `/api/inventory/batches/`
- `/api/inventory/stock-ledger/` (read-only)

All endpoints are JWT protected except `/api/health/`.

## Role rules (current)

- **ADMIN**: CRUD everything within their company.
- **MANAGER**: read-only for now (future extensions in Step B).
- **CASHIER**: read products/batches and warehouse scope; sales endpoints later.
- **INVENTORY**: CRUD batches; stock ledger creation later.
- **ACCOUNTANT**: read-only for now; accounting endpoints later.

Access scoping:
- `allowed_branches`/`allowed_warehouses` on `UserProfile` default to **all** in the company when empty.

## Seed demo data (dev only)

```bash
cd backend
python manage.py seed_demo_pharmacy
```

Default credentials (override with env vars below):

- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

Optional env overrides:

```bash
DEMO_ADMIN_USERNAME=admin
DEMO_ADMIN_PASSWORD=admin123
DEMO_CASHIER_USERNAME=cashier
DEMO_CASHIER_PASSWORD=cashier123
```

## Tests

```bash
cd backend
python manage.py test
```
