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

## API endpoints (foundation)

- `GET /api/health/` — health check

Future endpoints will follow `/api/<module>/...` for master data, inventory, sales, purchases, accounting, reports, and compliance.
