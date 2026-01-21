from __future__ import annotations

from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone
from rest_framework import serializers

from inventory import services as inventory_services

from .models import Payment, SaleInvoice, SaleItem


def _ensure_company(company):
    if not company:
        raise serializers.ValidationError("User is not associated with a company.")


def _validate_positive_amount(amount, label):
    if amount is None:
        return
    if amount <= 0:
        raise serializers.ValidationError(f"{label} must be greater than zero.")


def _generate_invoice_number(company, invoice_date):
    date_str = invoice_date.strftime("%Y%m%d")
    last_invoice = (
        SaleInvoice.objects.select_for_update()
        .filter(company=company, invoice_date=invoice_date)
        .order_by("-sequence")
        .first()
    )
    next_sequence = 1 if not last_invoice else last_invoice.sequence + 1
    invoice_no = f"{date_str}-{next_sequence:04d}"
    return invoice_no, next_sequence


def _build_item_payload(items):
    payload = []
    for item in items:
        product = item["product"]
        qty = item["qty"]
        if qty <= 0:
            raise serializers.ValidationError("Item quantity must be greater than zero.")
        payload.append({"product": product, "qty": qty})
    return payload


def create_sale_invoice(
    *,
    company,
    branch,
    warehouse,
    items,
    discount_total,
    tax_total,
    payments,
    user,
):
    _ensure_company(company)
    if not items:
        raise serializers.ValidationError("At least one item is required.")
    discount_total = discount_total or Decimal("0.00")
    tax_total = tax_total or Decimal("0.00")
    if discount_total < 0 or tax_total < 0:
        raise serializers.ValidationError("Discount and tax totals cannot be negative.")
    for payment in payments or []:
        _validate_positive_amount(payment["amount"], "Payment amount")

    with transaction.atomic():
        invoice_date = timezone.now().date()
        invoice_no, sequence = _generate_invoice_number(company, invoice_date)
        invoice = SaleInvoice.objects.create(
            company=company,
            branch=branch,
            warehouse=warehouse,
            invoice_no=invoice_no,
            invoice_date=invoice_date,
            sequence=sequence,
            created_by=user,
            status=SaleInvoice.Status.DRAFT,
            kind=SaleInvoice.Kind.SALE,
        )
        ledger_entries = inventory_services.sell_stock(
            company=company,
            warehouse=warehouse,
            items=_build_item_payload(items),
            ref_type="SALE",
            ref_id=invoice.invoice_no,
            user=user,
        )
        sale_items = []
        subtotal = Decimal("0.00")
        for entry in ledger_entries:
            unit_price = entry.batch.selling_price
            line_total = (entry.qty * unit_price).quantize(Decimal("0.01"))
            subtotal += line_total
            sale_items.append(
                SaleItem(
                    invoice=invoice,
                    product=entry.product,
                    batch=entry.batch,
                    qty=entry.qty,
                    unit_price=unit_price,
                    line_total=line_total,
                )
            )
        SaleItem.objects.bulk_create(sale_items)
        grand_total = (subtotal - discount_total + tax_total).quantize(Decimal("0.01"))
        if grand_total < 0:
            raise serializers.ValidationError("Grand total cannot be negative.")
        total_paid = sum((payment["amount"] for payment in payments or []), Decimal("0.00"))
        if total_paid >= grand_total and grand_total > 0:
            status = SaleInvoice.Status.PAID
        elif total_paid > 0:
            status = SaleInvoice.Status.PARTIAL
        else:
            status = SaleInvoice.Status.DRAFT
        invoice.subtotal = subtotal
        invoice.discount_total = discount_total
        invoice.tax_total = tax_total
        invoice.grand_total = grand_total
        invoice.status = status
        invoice.save(update_fields=["subtotal", "discount_total", "tax_total", "grand_total", "status"])
        if payments:
            Payment.objects.bulk_create(
                [
                    Payment(
                        invoice=invoice,
                        method=payment["method"],
                        amount=payment["amount"],
                        reference=payment.get("reference", ""),
                    )
                    for payment in payments
                ]
            )
        if invoice.status == SaleInvoice.Status.PAID and not invoice.gl_entry_id:
            from accounting.services import post_sale_to_gl

            post_sale_to_gl(invoice, user)
        return invoice


def add_payment(*, company, invoice, payments, user):
    _ensure_company(company)
    if invoice.company_id != company.id:
        raise serializers.ValidationError("Invoice does not belong to your company.")
    if invoice.status in {SaleInvoice.Status.VOID, SaleInvoice.Status.RETURNED}:
        raise serializers.ValidationError("Payments are not allowed for void or returned invoices.")
    if not payments:
        raise serializers.ValidationError("At least one payment is required.")
    for payment in payments:
        _validate_positive_amount(payment["amount"], "Payment amount")

    with transaction.atomic():
        Payment.objects.bulk_create(
            [
                Payment(
                    invoice=invoice,
                    method=payment["method"],
                    amount=payment["amount"],
                    reference=payment.get("reference", ""),
                )
                for payment in payments
            ]
        )
        total_paid = invoice.payments.aggregate(total=models.Sum("amount"))["total"] or Decimal(
            "0.00"
        )
        if total_paid >= invoice.grand_total and invoice.grand_total > 0:
            invoice.status = SaleInvoice.Status.PAID
        elif total_paid > 0:
            invoice.status = SaleInvoice.Status.PARTIAL
        else:
            invoice.status = SaleInvoice.Status.DRAFT
        invoice.save(update_fields=["status"])
        if invoice.status == SaleInvoice.Status.PAID and not invoice.gl_entry_id:
            from accounting.services import post_sale_to_gl

            post_sale_to_gl(invoice, user)
        return invoice


def return_sale_invoice(*, company, invoice, items, user):
    _ensure_company(company)
    if invoice.company_id != company.id:
        raise serializers.ValidationError("Invoice does not belong to your company.")
    if invoice.status == SaleInvoice.Status.RETURNED:
        raise serializers.ValidationError("Invoice has already been returned.")
    if invoice.status == SaleInvoice.Status.VOID:
        raise serializers.ValidationError("Void invoices cannot be returned.")
    if not items:
        raise serializers.ValidationError("At least one return item is required.")

    with transaction.atomic():
        invoice_date = timezone.now().date()
        invoice_no, sequence = _generate_invoice_number(company, invoice_date)
        return_invoice = SaleInvoice.objects.create(
            company=company,
            branch=invoice.branch,
            warehouse=invoice.warehouse,
            invoice_no=invoice_no,
            invoice_date=invoice_date,
            sequence=sequence,
            created_by=user,
            status=SaleInvoice.Status.RETURNED,
            kind=SaleInvoice.Kind.RETURN,
            original_invoice=invoice,
        )
        return_items_payload = []
        sale_items = []
        subtotal = Decimal("0.00")
        for item in items:
            sale_item = item["sale_item"]
            qty = item["qty"]
            if qty <= 0:
                raise serializers.ValidationError("Return quantity must be greater than zero.")
            if sale_item.invoice_id != invoice.id:
                raise serializers.ValidationError("Return item does not belong to this invoice.")
            if sale_item.batch is None:
                raise serializers.ValidationError("Return item is missing batch information.")
            if qty > sale_item.qty:
                raise serializers.ValidationError("Return quantity exceeds sold quantity.")
            return_items_payload.append({"batch": sale_item.batch, "qty": qty})
            line_total = (qty * sale_item.unit_price).quantize(Decimal("0.01"))
            subtotal -= line_total
            sale_items.append(
                SaleItem(
                    invoice=return_invoice,
                    product=sale_item.product,
                    batch=sale_item.batch,
                    qty=-qty,
                    unit_price=sale_item.unit_price,
                    line_total=-line_total,
                )
            )
        inventory_services.return_stock(
            company=company,
            warehouse=invoice.warehouse,
            items=return_items_payload,
            ref_type="RETURN",
            ref_id=return_invoice.invoice_no,
            user=user,
            note=f"Return for {invoice.invoice_no}",
        )
        SaleItem.objects.bulk_create(sale_items)
        return_invoice.subtotal = subtotal
        return_invoice.discount_total = Decimal("0.00")
        return_invoice.tax_total = Decimal("0.00")
        return_invoice.grand_total = subtotal
        return_invoice.save(
            update_fields=["subtotal", "discount_total", "tax_total", "grand_total"]
        )
        return return_invoice
