from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import serializers
from rest_framework.test import APIClient

from accounts.models import UserProfile
from masterdata.models import Branch, Company, Product, Warehouse

from .models import Batch, StockLedger
from .services import receive_stock, sell_stock, transfer_stock


class InventoryServiceTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
        self.branch = Branch.objects.create(company=self.company, name="Main", code="MAIN")
        self.warehouse = Warehouse.objects.create(
            branch=self.branch, name="Main Warehouse", code="MAIN-WH"
        )
        self.second_warehouse = Warehouse.objects.create(
            branch=self.branch, name="Secondary Warehouse", code="SEC-WH"
        )
        self.product = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Test Drug",
            sku="DRUG-001",
            reorder_level=Decimal("10.00"),
        )
        self.user = get_user_model().objects.create_user(username="admin", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.ADMIN
        )

    def test_receive_increases_qty_and_creates_ledger(self):
        receive_stock(
            company=self.company,
            warehouse=self.warehouse,
            items=[
                {
                    "product": self.product,
                    "batch_no": "B-1",
                    "expiry_date": "2030-01-01",
                    "purchase_price": Decimal("5.00"),
                    "selling_price": Decimal("8.00"),
                    "qty": Decimal("5.00"),
                }
            ],
            ref_type="PURCHASE",
            ref_id="PO-1",
            user=self.user,
        )
        batch = Batch.objects.get(batch_no="B-1")
        self.assertEqual(batch.qty_on_hand, Decimal("5.00"))
        ledger = StockLedger.objects.get(ref_id="PO-1")
        self.assertEqual(ledger.movement_type, StockLedger.MovementType.IN)

    def test_sell_uses_fefo_across_batches(self):
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
        sell_stock(
            company=self.company,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("7.00")}],
            ref_type="SALE",
            ref_id="SO-1",
            user=self.user,
        )
        early = Batch.objects.get(batch_no="B-early")
        late = Batch.objects.get(batch_no="B-late")
        self.assertEqual(early.qty_on_hand, Decimal("0.00"))
        self.assertEqual(late.qty_on_hand, Decimal("3.00"))
        ledger_entries = StockLedger.objects.filter(ref_id="SO-1").order_by("id")
        self.assertEqual(ledger_entries.count(), 2)
        self.assertEqual(ledger_entries.first().batch.batch_no, "B-early")

    def test_sell_expired_batch_forbidden_unless_allowed(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-exp",
            expiry_date=(timezone.now().date() - timedelta(days=1)),
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        with self.assertRaises(serializers.ValidationError):
            sell_stock(
                company=self.company,
                warehouse=self.warehouse,
                items=[{"product": self.product, "qty": Decimal("2.00")}],
                ref_type="SALE",
                ref_id="SO-2",
                user=self.user,
            )
        sell_stock(
            company=self.company,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("2.00")}],
            ref_type="SALE",
            ref_id="SO-3",
            user=self.user,
            allow_expired=True,
        )
        batch = Batch.objects.get(batch_no="B-exp")
        self.assertEqual(batch.qty_on_hand, Decimal("3.00"))

    def test_transfer_creates_out_and_in_and_moves_qty(self):
        batch = Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-move",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("10.00"),
        )
        transfer_stock(
            company=self.company,
            from_warehouse=self.warehouse,
            to_warehouse=self.second_warehouse,
            items=[{"batch": batch, "qty": Decimal("4.00")}],
            ref_type="TRANSFER",
            ref_id="TR-1",
            user=self.user,
        )
        batch.refresh_from_db()
        self.assertEqual(batch.qty_on_hand, Decimal("6.00"))
        dest_batch = Batch.objects.get(
            company=self.company,
            warehouse=self.second_warehouse,
            batch_no="B-move",
        )
        self.assertEqual(dest_batch.qty_on_hand, Decimal("4.00"))
        self.assertEqual(
            StockLedger.objects.filter(ref_id="TR-1").count(),
            2,
        )


class InventoryAlertEndpointTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
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
        self.user = get_user_model().objects.create_user(username="admin", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.INVENTORY
        )
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "admin", "password": "pass1234"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_low_stock_alert_endpoint(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-low",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        response = self.client.get(
            f"/api/inventory/alerts/low-stock/?warehouse={self.warehouse.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["product_id"], self.product.id)

    def test_near_expiry_alert_endpoint(self):
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-expiring",
            expiry_date=(timezone.now().date() + timedelta(days=10)),
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("5.00"),
        )
        response = self.client.get(
            f"/api/inventory/alerts/near-expiry/?warehouse={self.warehouse.id}&days=30"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["batch_no"], "B-expiring")
