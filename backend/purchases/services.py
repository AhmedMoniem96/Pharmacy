from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from inventory import services as inventory_services

from .models import (
    GoodsReceipt,
    GoodsReceiptItem,
    PurchaseOrder,
    PurchaseOrderItem,
    SupplierInvoice,
)


def _ensure_company(company):
    if not company:
        raise serializers.ValidationError("User is not associated with a company.")


def _validate_non_negative(amount, label):
    if amount is None:
        return
    if amount < 0:
        raise serializers.ValidationError(f"{label} cannot be negative.")


def _validate_positive(amount, label):
    if amount is None:
        return
    if amount <= 0:
        raise serializers.ValidationError(f"{label} must be greater than zero.")


def _generate_po_number(company):
    today = timezone.now().date()
    date_str = today.strftime("%Y%m%d")
    last_po = (
        PurchaseOrder.objects.select_for_update()
        .filter(company=company, created_at__date=today)
        .order_by("-id")
        .first()
    )
    if not last_po:
        next_sequence = 1
    else:
        try:
            next_sequence = int(last_po.po_no.split("-")[-1]) + 1
        except (ValueError, IndexError):
            next_sequence = 1
    return f"PO-{date_str}-{next_sequence:04d}"


def _generate_grn_number(company):
    today = timezone.now().date()
    date_str = today.strftime("%Y%m%d")
    last_grn = (
        GoodsReceipt.objects.select_for_update()
        .filter(company=company, created_at__date=today)
        .order_by("-id")
        .first()
    )
    if not last_grn:
        next_sequence = 1
    else:
        try:
            next_sequence = int(last_grn.grn_no.split("-")[-1]) + 1
        except (ValueError, IndexError):
            next_sequence = 1
    return f"GRN-{date_str}-{next_sequence:04d}"


def create_purchase_order(
    *,
    company,
    branch,
    warehouse,
    items,
    discount_total,
    tax_total,
    user,
):
    _ensure_company(company)
    if not items:
        raise serializers.ValidationError("At least one item is required.")
    discount_total = discount_total or Decimal("0.00")
    tax_total = tax_total or Decimal("0.00")
    _validate_non_negative(discount_total, "Discount total")
    _validate_non_negative(tax_total, "Tax total")

    with transaction.atomic():
        po_no = _generate_po_number(company)
        purchase_order = PurchaseOrder.objects.create(
            company=company,
            branch=branch,
            warehouse=warehouse,
            po_no=po_no,
            status=PurchaseOrder.Status.DRAFT,
            created_by=user,
        )
        subtotal = Decimal("0.00")
        po_items = []
        for item in items:
            qty = item["qty"]
            unit_cost = item["unit_cost"]
            _validate_positive(qty, "Quantity")
            _validate_positive(unit_cost, "Unit cost")
            line_total = (qty * unit_cost).quantize(Decimal("0.01"))
            subtotal += line_total
            po_items.append(
                PurchaseOrderItem(
                    purchase_order=purchase_order,
                    product=item["product"],
                    qty=qty,
                    unit_cost=unit_cost,
                    line_total=line_total,
                )
            )
        PurchaseOrderItem.objects.bulk_create(po_items)
        grand_total = (subtotal - discount_total + tax_total).quantize(Decimal("0.01"))
        if grand_total < 0:
            raise serializers.ValidationError("Grand total cannot be negative.")
        purchase_order.subtotal = subtotal
        purchase_order.discount_total = discount_total
        purchase_order.tax_total = tax_total
        purchase_order.grand_total = grand_total
        purchase_order.save(
            update_fields=["subtotal", "discount_total", "tax_total", "grand_total"]
        )
        return purchase_order


def post_goods_receipt(*, company, goods_receipt, user):
    _ensure_company(company)
    if goods_receipt.company_id != company.id:
        raise serializers.ValidationError("Goods receipt does not belong to your company.")
    if goods_receipt.status != GoodsReceipt.Status.DRAFT:
        raise serializers.ValidationError("Only draft goods receipts can be posted.")
    items = list(goods_receipt.items.select_related("product"))
    if not items:
        raise serializers.ValidationError("Goods receipt has no items.")

    with transaction.atomic():
        inventory_services.receive_stock(
            company=company,
            warehouse=goods_receipt.warehouse,
            items=[
                {
                    "product": item.product,
                    "qty": item.qty,
                    "batch_no": item.batch_no,
                    "expiry_date": item.expiry_date,
                    "purchase_price": item.unit_cost,
                    "selling_price": item.selling_price or item.unit_cost,
                }
                for item in items
            ],
            ref_type="GRN",
            ref_id=goods_receipt.grn_no,
            user=user,
        )
        goods_receipt.status = GoodsReceipt.Status.POSTED
        goods_receipt.received_at = timezone.now()
        goods_receipt.save(update_fields=["status", "received_at"])
        return goods_receipt


def create_supplier_invoice(
    *,
    company,
    supplier,
    warehouse,
    supplier_invoice_no,
    subtotal,
    tax_total,
    ref_grn,
    user,
):
    _ensure_company(company)
    subtotal = subtotal or Decimal("0.00")
    tax_total = tax_total or Decimal("0.00")
    _validate_non_negative(subtotal, "Subtotal")
    _validate_non_negative(tax_total, "Tax total")
    if ref_grn and ref_grn.company_id != company.id:
        raise serializers.ValidationError("GRN does not belong to your company.")
    if ref_grn and ref_grn.warehouse_id != warehouse.id:
        raise serializers.ValidationError("GRN warehouse does not match invoice warehouse.")
    if ref_grn and ref_grn.supplier_id != supplier.id:
        raise serializers.ValidationError("GRN supplier does not match invoice supplier.")
    grand_total = (subtotal + tax_total).quantize(Decimal("0.01"))

    with transaction.atomic():
        invoice = SupplierInvoice.objects.create(
            company=company,
            supplier=supplier,
            warehouse=warehouse,
            supplier_invoice_no=supplier_invoice_no,
            status=SupplierInvoice.Status.DRAFT,
            subtotal=subtotal,
            tax_total=tax_total,
            grand_total=grand_total,
            ref_grn=ref_grn,
            created_by=user,
        )
        return invoice


def post_supplier_invoice(*, company, invoice, user):
    _ensure_company(company)
    if invoice.company_id != company.id:
        raise serializers.ValidationError("Supplier invoice does not belong to your company.")
    if invoice.status != SupplierInvoice.Status.DRAFT:
        raise serializers.ValidationError("Only draft supplier invoices can be posted.")

    with transaction.atomic():
        invoice.status = SupplierInvoice.Status.POSTED
        invoice.save(update_fields=["status"])
        from accounting.services import post_purchase_to_gl

        post_purchase_to_gl(invoice, user)
        return invoice
