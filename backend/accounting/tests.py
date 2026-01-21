from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import models
from django.test import TestCase
from rest_framework import serializers
from rest_framework.test import APIClient

from accounts.models import UserProfile
from masterdata.models import Branch, Company, Product, Warehouse
from purchases.models import Supplier
from purchases.services import create_supplier_invoice, post_supplier_invoice
from sales.services import create_sale_invoice

from .models import JournalEntry
from .services import post_sale_to_gl


class AccountingPostingTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
        self.branch = Branch.objects.create(company=self.company, name="Main", code="MAIN")
        self.warehouse = Warehouse.objects.create(
            branch=self.branch, name="Main Warehouse", code="MAIN-WH"
        )
        self.product = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Pain Reliever",
            sku="DRUG-101",
        )
        self.user = get_user_model().objects.create_user(username="admin", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.ADMIN
        )
        call_command("seed_chart_of_accounts")

    def test_post_sale_creates_balanced_entry(self):
        from inventory.models import Batch

        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-ACC-1",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("10.00"),
            qty_on_hand=Decimal("5.00"),
        )
        invoice = create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("2.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("2.00"),
            payments=[{"method": "CASH", "amount": Decimal("22.00")}],
            user=self.user,
        )
        invoice.refresh_from_db()
        entry = JournalEntry.objects.get(id=invoice.gl_entry_id)
        totals = entry.lines.aggregate(
            debit_total=models.Sum("debit"), credit_total=models.Sum("credit")
        )
        self.assertEqual(totals["debit_total"], totals["credit_total"])
        self.assertTrue(entry.posted)

    def test_post_purchase_creates_balanced_entry(self):
        supplier = Supplier.objects.create(company=self.company, name="Supplier One")
        invoice = create_supplier_invoice(
            company=self.company,
            supplier=supplier,
            warehouse=self.warehouse,
            supplier_invoice_no="SUP-100",
            subtotal=Decimal("100.00"),
            tax_total=Decimal("15.00"),
            ref_grn=None,
            user=self.user,
        )
        posted_invoice = post_supplier_invoice(
            company=self.company, invoice=invoice, user=self.user
        )
        entry = JournalEntry.objects.get(id=posted_invoice.gl_entry_id)
        totals = entry.lines.aggregate(
            debit_total=models.Sum("debit"), credit_total=models.Sum("credit")
        )
        self.assertEqual(totals["debit_total"], totals["credit_total"])
        self.assertTrue(entry.posted)

    def test_no_double_posting(self):
        from inventory.models import Batch

        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-ACC-2",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("10.00"),
            qty_on_hand=Decimal("5.00"),
        )
        invoice = create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("1.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("10.00")}],
            user=self.user,
        )
        with self.assertRaises(serializers.ValidationError):
            post_sale_to_gl(invoice, self.user)


class AccountingPermissionsTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
        self.user = get_user_model().objects.create_user(username="cashier", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.CASHIER
        )
        call_command("seed_chart_of_accounts")
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "cashier", "password": "pass1234"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_permissions_accounting_denied_for_cashier(self):
        response = self.client.get("/api/accounting/accounts/")
        self.assertEqual(response.status_code, 403)
