from __future__ import annotations

from decimal import Decimal

from django.db import models, transaction
from rest_framework import serializers

from accounts.audit import log_audit_event

from .models import Account, Journal, JournalEntry, JournalLine

ACCOUNT_CASH = "1000"
ACCOUNT_INVENTORY = "1200"
ACCOUNT_INPUT_VAT = "1300"
ACCOUNT_ACCOUNTS_PAYABLE = "2000"
ACCOUNT_OUTPUT_VAT = "2100"
ACCOUNT_SALES_REVENUE = "4000"
ACCOUNT_PURCHASES_EXPENSE = "5000"


def vat_calculation(amount: Decimal, rate: Decimal) -> Decimal:
    if amount is None or rate is None:
        return Decimal("0.00")
    return (Decimal(amount) * Decimal(rate)).quantize(Decimal("0.01"))


def _get_account(company, code, label):
    account = Account.objects.filter(company=company, code=code, is_active=True).first()
    if not account:
        raise serializers.ValidationError(f"{label} account is not configured.")
    return account


def _get_journal(company, code):
    journal = Journal.objects.filter(company=company, code=code).first()
    if not journal:
        raise serializers.ValidationError(f"{code} journal is not configured.")
    return journal


def _generate_entry_no(company):
    last_entry = (
        JournalEntry.objects.select_for_update()
        .filter(company=company)
        .order_by("-entry_no")
        .first()
    )
    return 1 if not last_entry else last_entry.entry_no + 1


def _ensure_balanced(lines):
    total_debit = sum((line.debit for line in lines), Decimal("0.00"))
    total_credit = sum((line.credit for line in lines), Decimal("0.00"))
    if total_debit.quantize(Decimal("0.01")) != total_credit.quantize(Decimal("0.01")):
        raise serializers.ValidationError("Journal entry is not balanced.")


def post_sale_to_gl(sale_invoice, user):
    if sale_invoice.gl_entry_id:
        raise serializers.ValidationError("Sale invoice has already been posted.")
    if sale_invoice.status != sale_invoice.Status.PAID:
        raise serializers.ValidationError("Only paid sale invoices can be posted.")
    paid_total = (
        sale_invoice.payments.aggregate(total=models.Sum("amount"))["total"]
        if hasattr(sale_invoice, "payments")
        else None
    )
    if paid_total is None:
        paid_total = Decimal("0.00")
    paid_total = paid_total.quantize(Decimal("0.01"))
    if paid_total != sale_invoice.grand_total:
        raise serializers.ValidationError("Paid total must equal grand total for posting.")

    cash_account = _get_account(sale_invoice.company, ACCOUNT_CASH, "Cash")
    revenue_account = _get_account(sale_invoice.company, ACCOUNT_SALES_REVENUE, "Sales revenue")
    output_vat_account = _get_account(sale_invoice.company, ACCOUNT_OUTPUT_VAT, "Output VAT")
    journal = _get_journal(sale_invoice.company, "SALES")

    net_amount = (sale_invoice.subtotal - sale_invoice.discount_total).quantize(
        Decimal("0.01")
    )
    tax_amount = sale_invoice.tax_total.quantize(Decimal("0.01"))

    with transaction.atomic():
        entry = JournalEntry.objects.create(
            company=sale_invoice.company,
            journal=journal,
            entry_no=_generate_entry_no(sale_invoice.company),
            date=sale_invoice.invoice_date,
            memo=f"Sale {sale_invoice.invoice_no}",
            ref_type="SALE",
            ref_id=sale_invoice.invoice_no,
            posted=False,
            created_by=user,
        )
        lines = [
            JournalLine(entry=entry, account=cash_account, debit=paid_total),
            JournalLine(entry=entry, account=revenue_account, credit=net_amount),
        ]
        if tax_amount > 0:
            lines.append(JournalLine(entry=entry, account=output_vat_account, credit=tax_amount))
        _ensure_balanced(lines)
        JournalLine.objects.bulk_create(lines)
        entry.posted = True
        entry.save(update_fields=["posted"])
        sale_invoice.gl_entry = entry
        sale_invoice.save(update_fields=["gl_entry"])
        log_audit_event(
            company=sale_invoice.company,
            user=user,
            action="POST",
            entity_type="JournalEntry",
            entity_id=entry.id,
            summary=f"Posted sale invoice {sale_invoice.invoice_no} to GL",
        )
        return entry


def post_purchase_to_gl(supplier_invoice, user):
    if supplier_invoice.gl_entry_id:
        raise serializers.ValidationError("Supplier invoice has already been posted.")
    if supplier_invoice.status != supplier_invoice.Status.POSTED:
        raise serializers.ValidationError("Supplier invoice must be posted before GL posting.")

    purchases_account = _get_account(
        supplier_invoice.company, ACCOUNT_PURCHASES_EXPENSE, "Purchases"
    )
    input_vat_account = _get_account(
        supplier_invoice.company, ACCOUNT_INPUT_VAT, "Input VAT"
    )
    accounts_payable = _get_account(
        supplier_invoice.company, ACCOUNT_ACCOUNTS_PAYABLE, "Accounts payable"
    )
    journal = _get_journal(supplier_invoice.company, "PURCHASE")

    subtotal = supplier_invoice.subtotal.quantize(Decimal("0.01"))
    tax_total = supplier_invoice.tax_total.quantize(Decimal("0.01"))
    grand_total = supplier_invoice.grand_total.quantize(Decimal("0.01"))

    with transaction.atomic():
        entry = JournalEntry.objects.create(
            company=supplier_invoice.company,
            journal=journal,
            entry_no=_generate_entry_no(supplier_invoice.company),
            date=supplier_invoice.created_at.date(),
            memo=f"Supplier invoice {supplier_invoice.supplier_invoice_no}",
            ref_type="SUPPLIER_INVOICE",
            ref_id=supplier_invoice.supplier_invoice_no,
            posted=False,
            created_by=user,
        )
        lines = [
            JournalLine(entry=entry, account=purchases_account, debit=subtotal),
            JournalLine(entry=entry, account=accounts_payable, credit=grand_total),
        ]
        if tax_total > 0:
            lines.append(JournalLine(entry=entry, account=input_vat_account, debit=tax_total))
        _ensure_balanced(lines)
        JournalLine.objects.bulk_create(lines)
        entry.posted = True
        entry.save(update_fields=["posted"])
        supplier_invoice.gl_entry = entry
        supplier_invoice.save(update_fields=["gl_entry"])
        log_audit_event(
            company=supplier_invoice.company,
            user=user,
            action="POST",
            entity_type="JournalEntry",
            entity_id=entry.id,
            summary=f"Posted supplier invoice {supplier_invoice.supplier_invoice_no} to GL",
        )
        return entry
