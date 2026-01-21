from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import serializers
from rest_framework.test import APIClient

from accounting.models import Account, Journal
from accounting.services import post_sale_to_gl
from accounts.models import UserProfile
from inventory.models import Batch
from masterdata.models import Branch, Company, Product, Warehouse
from purchases.models import GoodsReceipt, GoodsReceiptItem, Supplier
from purchases.services import create_supplier_invoice
from sales.services import create_sale_invoice


class TenantIsolationTests(TestCase):
    def setUp(self):
        self.company_a = Company.objects.create(name="Alpha")
        self.company_b = Company.objects.create(name="Bravo")
        self.user = get_user_model().objects.create_user(
            username="alpha-admin", password="pass1234"
        )
        UserProfile.objects.create(
            user=self.user, company=self.company_a, role=UserProfile.Role.ADMIN
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_cross_company_product_access_blocked(self):
        product_b = Product.objects.create(
            company=self.company_b,
            type=Product.ProductType.DRUG,
            name="Other Drug",
            sku="BRAVO-001",
            reorder_level=Decimal("5.00"),
        )
        response = self.client.get(f"/api/masterdata/products/{product_b.id}/")
        self.assertEqual(response.status_code, 404)

    def test_cross_company_supplier_access_blocked(self):
        supplier_b = Supplier.objects.create(company=self.company_b, name="Other Supplier")
        response = self.client.get(f"/api/purchases/suppliers/{supplier_b.id}/")
        self.assertEqual(response.status_code, 404)


class HardeningIdempotencyTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Hardening Pharmacy")
        self.branch = Branch.objects.create(company=self.company, name="Main", code="MAIN")
        self.warehouse = Warehouse.objects.create(
            branch=self.branch, name="Main Warehouse", code="MAIN-WH"
        )
        self.product = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Test Drug",
            sku="DRUG-001",
            reorder_level=Decimal("10.00"),
        )
        self._create_accounting_setup()
        self.user = get_user_model().objects.create_user(
            username="ops-admin", password="pass1234"
        )
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.ADMIN
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _create_accounting_setup(self):
        Account.objects.bulk_create(
            [
                Account(
                    company=self.company,
                    code="1000",
                    name="Cash",
                    type=Account.Type.ASSET,
                ),
                Account(
                    company=self.company,
                    code="4000",
                    name="Sales Revenue",
                    type=Account.Type.INCOME,
                ),
                Account(
                    company=self.company,
                    code="2100",
                    name="Output VAT",
                    type=Account.Type.LIABILITY,
                ),
                Account(
                    company=self.company,
                    code="5000",
                    name="Purchases Expense",
                    type=Account.Type.EXPENSE,
                ),
                Account(
                    company=self.company,
                    code="1300",
                    name="Input VAT",
                    type=Account.Type.ASSET,
                ),
                Account(
                    company=self.company,
                    code="2000",
                    name="Accounts Payable",
                    type=Account.Type.LIABILITY,
                ),
            ]
        )
        Journal.objects.bulk_create(
            [
                Journal(
                    company=self.company,
                    code="SALES",
                    name="Sales Journal",
                    type=Journal.Type.SALES,
                ),
                Journal(
                    company=self.company,
                    code="PURCHASE",
                    name="Purchase Journal",
                    type=Journal.Type.PURCHASE,
                ),
            ]
        )

    def test_goods_receipt_post_cannot_double_post(self):
        supplier = Supplier.objects.create(company=self.company, name="Acme Supplier")
        grn = GoodsReceipt.objects.create(
            company=self.company,
            supplier=supplier,
            warehouse=self.warehouse,
            grn_no="GRN-20250101-0001",
            status=GoodsReceipt.Status.DRAFT,
            created_by=self.user,
        )
        GoodsReceiptItem.objects.create(
            goods_receipt=grn,
            product=self.product,
            batch_no="B-PO",
            expiry_date="2030-01-01",
            qty=Decimal("5.00"),
            unit_cost=Decimal("4.00"),
            selling_price=Decimal("6.00"),
        )
        first = self.client.post(f"/api/purchases/goods-receipts/{grn.id}/post/")
        self.assertEqual(first.status_code, 200)
        second = self.client.post(f"/api/purchases/goods-receipts/{grn.id}/post/")
        self.assertEqual(second.status_code, 400)

    def test_supplier_invoice_post_cannot_double_post(self):
        supplier = Supplier.objects.create(company=self.company, name="Acme Supplier")
        invoice = create_supplier_invoice(
            company=self.company,
            supplier=supplier,
            warehouse=self.warehouse,
            supplier_invoice_no="INV-100",
            subtotal=Decimal("100.00"),
            tax_total=Decimal("5.00"),
            ref_grn=None,
            user=self.user,
        )
        first = self.client.post(f"/api/purchases/supplier-invoices/{invoice.id}/post/")
        self.assertEqual(first.status_code, 200)
        second = self.client.post(f"/api/purchases/supplier-invoices/{invoice.id}/post/")
        self.assertEqual(second.status_code, 400)

    def test_sale_gl_post_cannot_double_post(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-1",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        invoice = create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("2.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("16.00")}],
            user=self.user,
        )
        with self.assertRaises(serializers.ValidationError):
            post_sale_to_gl(invoice, self.user)

    def test_compliance_send_blocks_duplicates_without_force(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-2",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        invoice = create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("1.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("8.00")}],
            user=self.user,
        )
        first = self.client.post(f"/api/compliance/zatca/invoices/{invoice.id}/send/")
        self.assertEqual(first.status_code, 201)
        second = self.client.post(f"/api/compliance/zatca/invoices/{invoice.id}/send/")
        self.assertEqual(second.status_code, 400)
        forced = self.client.post(
            f"/api/compliance/zatca/invoices/{invoice.id}/send/?force=true"
        )
        self.assertEqual(forced.status_code, 201)


class ThrottlingConfigTests(TestCase):
    def test_throttling_config_present(self):
        throttles = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_CLASSES", [])
        self.assertIn("rest_framework.throttling.AnonRateThrottle", throttles)
        self.assertIn("rest_framework.throttling.UserRateThrottle", throttles)
        self.assertIn("rest_framework.throttling.ScopedRateThrottle", throttles)
        rates = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {})
        self.assertIn("auth_token", rates)
