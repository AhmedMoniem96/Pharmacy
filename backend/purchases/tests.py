from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from inventory.models import Batch, StockLedger
from masterdata.models import Branch, Company, Product, Warehouse

from .models import GoodsReceipt, GoodsReceiptItem, Supplier
from .services import create_purchase_order, create_supplier_invoice, post_goods_receipt


class PurchaseServiceTests(TestCase):
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
        self.supplier = Supplier.objects.create(company=self.company, name="Acme Supplier")
        self.user = get_user_model().objects.create_user(username="inventory", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.INVENTORY
        )

    def test_po_create_totals(self):
        po = create_purchase_order(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[
                {"product": self.product, "qty": Decimal("2.00"), "unit_cost": Decimal("5.00")}
            ],
            discount_total=Decimal("1.00"),
            tax_total=Decimal("0.50"),
            user=self.user,
        )
        self.assertEqual(po.subtotal, Decimal("10.00"))
        self.assertEqual(po.grand_total, Decimal("9.50"))

    def test_grn_post_increases_stock_and_creates_ledger_in(self):
        grn = GoodsReceipt.objects.create(
            company=self.company,
            supplier=self.supplier,
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
        post_goods_receipt(company=self.company, goods_receipt=grn, user=self.user)
        batch = Batch.objects.get(company=self.company, batch_no="B-PO")
        self.assertEqual(batch.qty_on_hand, Decimal("5.00"))
        ledger = StockLedger.objects.get(ref_id=grn.grn_no, movement_type=StockLedger.MovementType.IN)
        self.assertEqual(ledger.qty, Decimal("5.00"))

    def test_supplier_invoice_links_to_grn(self):
        grn = GoodsReceipt.objects.create(
            company=self.company,
            supplier=self.supplier,
            warehouse=self.warehouse,
            grn_no="GRN-20250101-0002",
            status=GoodsReceipt.Status.DRAFT,
            created_by=self.user,
        )
        invoice = create_supplier_invoice(
            company=self.company,
            supplier=self.supplier,
            warehouse=self.warehouse,
            supplier_invoice_no="INV-100",
            subtotal=Decimal("100.00"),
            tax_total=Decimal("5.00"),
            ref_grn=grn,
            user=self.user,
        )
        self.assertEqual(invoice.ref_grn_id, grn.id)


class PurchasePermissionTests(TestCase):
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
        self.supplier = Supplier.objects.create(company=self.company, name="Acme Supplier")
        self.grn = GoodsReceipt.objects.create(
            company=self.company,
            supplier=self.supplier,
            warehouse=self.warehouse,
            grn_no="GRN-20250101-0003",
            status=GoodsReceipt.Status.DRAFT,
            created_by=get_user_model().objects.create_user(
                username="manager", password="pass1234"
            ),
        )
        GoodsReceiptItem.objects.create(
            goods_receipt=self.grn,
            product=self.product,
            batch_no="B-PO",
            expiry_date="2030-01-01",
            qty=Decimal("5.00"),
            unit_cost=Decimal("4.00"),
            selling_price=Decimal("6.00"),
        )
        self.cashier = get_user_model().objects.create_user(
            username="cashier", password="pass1234"
        )
        UserProfile.objects.create(
            user=self.cashier, company=self.company, role=UserProfile.Role.CASHIER
        )
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "cashier", "password": "pass1234"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_permissions_receipt_post_denied_for_cashier(self):
        response = self.client.post(f"/api/purchases/goods-receipts/{self.grn.id}/post/")
        self.assertEqual(response.status_code, 403)
