from decimal import Decimal
from datetime import date, datetime

from masterdata.models import Product


def _serialize_decimal(value):
    return str(value) if isinstance(value, Decimal) else value


def _serialize_date(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def build_zatca_invoice_payload(invoice):
    items = list(invoice.items.select_related("product").all())
    payments = list(invoice.payments.all())
    paid_total = sum((payment.amount for payment in payments), Decimal("0.00"))
    return {
        "invoice_no": invoice.invoice_no,
        "invoice_date": _serialize_date(invoice.invoice_date),
        "created_at": _serialize_date(invoice.created_at),
        "branch": {
            "id": invoice.branch_id,
            "name": invoice.branch.name,
            "code": invoice.branch.code,
        },
        "warehouse": {
            "id": invoice.warehouse_id,
            "name": invoice.warehouse.name,
            "code": invoice.warehouse.code,
        },
        "totals": {
            "subtotal": _serialize_decimal(invoice.subtotal),
            "discount_total": _serialize_decimal(invoice.discount_total),
            "tax_total": _serialize_decimal(invoice.tax_total),
            "grand_total": _serialize_decimal(invoice.grand_total),
            "paid_total": _serialize_decimal(paid_total),
        },
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "qty": _serialize_decimal(item.qty),
                "unit_price": _serialize_decimal(item.unit_price),
                "line_total": _serialize_decimal(item.line_total),
            }
            for item in items
        ],
        "payments": [
            {"method": payment.method, "amount": _serialize_decimal(payment.amount)}
            for payment in payments
        ],
    }


def build_rsd_movement_payload(
    ledger_rows,
    *,
    ref_type=None,
    ref_id=None,
    stock_ledger_ids=None,
    include_non_drug=False,
):
    rows = list(ledger_rows)
    if not include_non_drug:
        rows = [row for row in rows if row.product.type == Product.ProductType.DRUG]
    payload = {
        "movement_scope": {
            "ref_type": ref_type,
            "ref_id": ref_id,
            "stock_ledger_ids": stock_ledger_ids,
            "include_non_drug": include_non_drug,
        },
        "rows": [
            {
                "id": row.id,
                "product_id": row.product_id,
                "product_name": row.product.name,
                "product_type": row.product.type,
                "qty": _serialize_decimal(row.qty),
                "batch_no": row.batch.batch_no if row.batch else None,
                "expiry_date": _serialize_date(row.batch.expiry_date) if row.batch else None,
                "warehouse": {
                    "id": row.warehouse_id,
                    "name": row.warehouse.name,
                    "code": row.warehouse.code,
                },
                "created_at": _serialize_date(row.created_at),
            }
            for row in rows
        ],
    }
    return payload
