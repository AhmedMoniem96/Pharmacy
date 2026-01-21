from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import UserProfile
from inventory.models import Batch
from masterdata.models import Branch, Company, Product, Warehouse

from .models import SaleInvoice, SaleItem
from .services import create_sale_invoice, return_sale_invoice


class PosSalesServiceTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
        self.branch = Branch.objects.create(company=self.company, name="Main", code="MAIN")
        self.warehouse = Warehouse.objects.create(
            branch=self.branch, name="Main Warehouse", code="MAIN-WH"
        )
        call_command("seed_chart_of_accounts")
        self.product = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Test Drug",
            sku="DRUG-001",
            reorder_level=Decimal("10.00"),
        )
        self.user = get_user_model().objects.create_user(username="cashier", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.CASHIER
        )

    def test_pos_sale_reduces_stock_and_creates_invoice(self):
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
        self.assertEqual(invoice.status, SaleInvoice.Status.PAID)
        batch = Batch.objects.get(batch_no="B-1")
        self.assertEqual(batch.qty_on_hand, Decimal("3.00"))
        self.assertEqual(SaleItem.objects.filter(invoice=invoice).count(), 1)

    def test_pos_sale_uses_fefo_batches(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-early",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-late",
            expiry_date="2030-06-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        invoice = create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("7.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("56.00")}],
            user=self.user,
        )
        early = Batch.objects.get(batch_no="B-early")
        late = Batch.objects.get(batch_no="B-late")
        self.assertEqual(early.qty_on_hand, Decimal("0.00"))
        self.assertEqual(late.qty_on_hand, Decimal("3.00"))
        sale_items = list(SaleItem.objects.filter(invoice=invoice).order_by("id"))
        self.assertEqual(sale_items[0].batch.batch_no, "B-early")

    def test_partial_payment_sets_partial_status(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-pay",
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
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("5.00")}],
            user=self.user,
        )
        self.assertEqual(invoice.status, SaleInvoice.Status.PARTIAL)

    def test_return_invoice_restores_stock(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-ret",
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
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("20.00")}],
            user=self.user,
        )
        sale_item = SaleItem.objects.get(invoice=invoice)
        return_invoice = return_sale_invoice(
            company=self.company,
            invoice=invoice,
            items=[{"sale_item": sale_item, "qty": Decimal("2.00")}],
            user=self.user,
        )
        batch = Batch.objects.get(batch_no="B-ret")
        self.assertEqual(batch.qty_on_hand, Decimal("5.00"))
        self.assertEqual(return_invoice.status, SaleInvoice.Status.RETURNED)


class PosReceiptTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
        self.branch = Branch.objects.create(company=self.company, name="Main", code="MAIN")
        self.warehouse = Warehouse.objects.create(
            branch=self.branch, name="Main Warehouse", code="MAIN-WH"
        )
        call_command("seed_chart_of_accounts")
        self.product = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Test Drug",
            sku="DRUG-001",
            reorder_level=Decimal("10.00"),
        )
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-rcpt",
            expiry_date=timezone.now().date() + timedelta(days=365),
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("10.00"),
            qty_on_hand=Decimal("5.00"),
        )
        self.user = get_user_model().objects.create_user(username="cashier", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.CASHIER
        )
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "cashier", "password": "pass1234"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_receipt_payload_structure(self):
        response = self.client.post(
            "/api/sales/pos/sale/",
            {
                "branch_id": self.branch.id,
                "warehouse_id": self.warehouse.id,
                "items": [{"product_id": self.product.id, "qty": "1"}],
                "discount_total": "0.00",
                "payments": [{"method": "CASH", "amount": "10.00"}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        invoice_id = response.data["id"]
        receipt = self.client.get(f"/api/sales/pos/{invoice_id}/receipt/")
        self.assertEqual(receipt.status_code, 200)
        payload = receipt.data
        self.assertIn("invoice_no", payload)
        self.assertIn("items", payload)
        self.assertIn("payments", payload)
        self.assertIn("grand_total", payload)
        self.assertEqual(payload["items"][0]["product_id"], self.product.id)
