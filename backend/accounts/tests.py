from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from inventory.models import Batch, StockLedger
from masterdata.models import Branch, Company, Product, Warehouse

from .models import UserProfile


class CoreFlowTests(TestCase):
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
        )
        self.batch = Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="BATCH-001",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("8.00"),
            qty_on_hand=Decimal("10.00"),
        )
        self.user = get_user_model().objects.create_user(username="admin", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.ADMIN
        )

    def test_create_ledger_entry(self):
        ledger = StockLedger.objects.create(
            company=self.company,
            warehouse=self.warehouse,
            product=self.product,
            batch=self.batch,
            movement_type=StockLedger.MovementType.IN,
            qty=Decimal("5.00"),
            unit_cost=Decimal("5.00"),
            ref_type="PURCHASE",
            ref_id="PO-1",
            created_by=self.user,
        )
        self.assertEqual(ledger.company, self.company)

    def test_accounts_me_endpoint(self):
        client = APIClient()
        response = client.post(
            "/api/auth/token/",
            {"username": "admin", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        access = response.data["access"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        me_response = client.get("/api/accounts/me/")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["role"], UserProfile.Role.ADMIN)
        self.assertEqual(me_response.data["company"]["id"], self.company.id)
