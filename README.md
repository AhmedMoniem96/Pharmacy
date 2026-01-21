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
- `POST /api/inventory/receive/`
- `POST /api/inventory/transfer/`
- `POST /api/inventory/adjust/`
- `GET /api/inventory/alerts/low-stock/?warehouse=<warehouse_id>`
- `GET /api/inventory/alerts/near-expiry/?warehouse=<warehouse_id>&days=30`

POS / Sales (Step C):
- `POST /api/sales/pos/sale/` — create sale invoice
- `POST /api/sales/pos/<invoice_id>/pay/` — add payment to an invoice
- `POST /api/sales/pos/<invoice_id>/return/` — return/void via compensating invoice
- `GET /api/sales/pos/<invoice_id>/receipt/` — JSON receipt

Purchasing (Step D):
- `/api/purchases/suppliers/`
- `/api/purchases/purchase-orders/`
- `/api/purchases/purchase-orders/<id>/submit/`
- `/api/purchases/goods-receipts/`
- `/api/purchases/goods-receipts/<id>/post/`
- `/api/purchases/supplier-invoices/`
- `/api/purchases/supplier-invoices/<id>/post/`

Accounting (Step E):
- `/api/accounting/accounts/`
- `/api/accounting/journals/`
- `/api/accounting/entries/`

All endpoints are JWT protected except `/api/health/`.

## Role rules (current)

- **ADMIN**: CRUD everything within their company.
- **MANAGER**: POS returns/voids + read access.
- **CASHIER**: create sales, add payments, view receipts.
- **INVENTORY**: CRUD batches; stock ledger creation later.
- **ACCOUNTANT**: read-only access to accounting endpoints.

Access scoping:
- `allowed_branches`/`allowed_warehouses` on `UserProfile` default to **all** in the company when empty.

## POS workflow (Step C)

- Invoice numbers are sequential per company and date (`YYYYMMDD-SEQ`).
- Sales always call `inventory.sell_stock()` to enforce FEFO.
- Expired batches are blocked unless `user.profile.can_sell_expired = true`.
- Payments can be added later; invoices move from `DRAFT` → `PARTIAL` → `PAID`.
- Returns create a compensating return invoice; original invoices are never deleted.

### Sale payload example

```json
{
  "branch_id": 1,
  "warehouse_id": 1,
  "items": [
    {"product_id": 10, "qty": "2"},
    {"product_id": 11, "qty": "1"}
  ],
  "discount_total": "5.00",
  "payments": [
    {"method": "CASH", "amount": "50.00"}
  ]
}
```

### Receipt JSON example

```json
{
  "id": 101,
  "invoice_no": "20260121-0001",
  "invoice_date": "2026-01-21",
  "status": "PAID",
  "kind": "SALE",
  "branch_id": 1,
  "branch_name": "Main",
  "warehouse_id": 1,
  "warehouse_name": "Main Warehouse",
  "created_by": "cashier",
  "created_at": "2026-01-21T12:00:00Z",
  "subtotal": "60.00",
  "discount_total": "5.00",
  "tax_total": "0.00",
  "grand_total": "55.00",
  "items": [
    {
      "product_id": 10,
      "product_name": "Pain Reliever",
      "sku": "DRUG-010",
      "batch_no": "B-001",
      "qty": "2.00",
      "unit_price": "30.00",
      "line_total": "60.00"
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": "55.00",
      "reference": "",
      "created_at": "2026-01-21T12:00:00Z"
    }
  ]
}
```

## Purchasing workflow (Step D)

- Purchase order numbers and GRN numbers are sequential per company and day.
- Posting a GRN calls `inventory.receive_stock()` to create stock ledger IN movements and update batch quantities.

### GRN payload example

```json
{
  "supplier_id": 12,
  "warehouse_id": 3,
  "ref_po_id": 7,
  "items": [
    {
      "product_id": 10,
      "batch_no": "B-2026-001",
      "expiry_date": "2026-12-31",
      "qty": "50.00",
      "unit_cost": "4.50",
      "selling_price": "7.00"
    }
  ]
}
```

## Accounting (Step E MVP)

Seed the chart of accounts and journals (per company):

```bash
cd backend
python manage.py seed_chart_of_accounts
```

Posting rules (current MVP):
- Sales are auto-posted to GL when invoices are **PAID** and fully paid.
- Supplier invoices are auto-posted when they are **POSTED**.
- No accounts receivable/payments module yet; partial sales remain unposted.

GL auto-posting:
- Sales: DR Cash, CR Sales Revenue, CR Output VAT (if any).
- Purchases: DR Purchases Expense, DR Input VAT (if any), CR Accounts Payable.

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

## Inventory actions (Step B)

Sales and stock deductions use FEFO (earliest expiry first). Expired batches are blocked unless the user profile has `can_sell_expired=true` or the service is called with `allow_expired=true`.

Receive stock:

```bash
curl -X POST http://localhost:8000/api/inventory/receive/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse": 1,
    "ref_type": "PURCHASE",
    "ref_id": "PO-1001",
    "note": "Initial receipt",
    "items": [
      {
        "product": 1,
        "batch_no": "B-001",
        "expiry_date": "2030-01-01",
        "purchase_price": "5.00",
        "selling_price": "8.00",
        "qty": "10.00"
      }
    ]
  }'
```

Transfer stock:

```bash
curl -X POST http://localhost:8000/api/inventory/transfer/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_warehouse": 1,
    "to_warehouse": 2,
    "ref_type": "TRANSFER",
    "ref_id": "TR-1001",
    "note": "Rebalance",
    "items": [
      {
        "batch": 10,
        "qty": "5.00"
      }
    ]
  }'
```

Adjust stock:

```bash
curl -X POST http://localhost:8000/api/inventory/adjust/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse": 1,
    "reason": "Cycle count",
    "items": [
      {
        "batch": 10,
        "qty": "-2.00"
      }
    ]
  }'
```

Low stock alert:

```bash
curl -X GET "http://localhost:8000/api/inventory/alerts/low-stock/?warehouse=1" \
  -H "Authorization: Bearer <token>"
```

Near expiry alert:

```bash
curl -X GET "http://localhost:8000/api/inventory/alerts/near-expiry/?warehouse=1&days=30" \
  -H "Authorization: Bearer <token>"
```
