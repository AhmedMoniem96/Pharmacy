from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import UserProfile
from accounting.models import Account, VATConfig
from masterdata.models import Branch, Company, Product, Warehouse
from purchases.models import Supplier
from purchases.services import create_supplier_invoice, post_supplier_invoice
from sales.services import create_sale_invoice
from inventory.models import Batch


class ReportsSalesTests(TestCase):
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
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-REPORT-1",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("10.00"),
            qty_on_hand=Decimal("20.00"),
        )
        self.user = get_user_model().objects.create_user(username="admin", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.ADMIN
        )
        call_command("seed_chart_of_accounts")
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "admin", "password": "pass1234"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_sales_summary_totals(self):
        create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("2.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("2.00"),
            payments=[{"method": "CASH", "amount": Decimal("22.00")}],
            user=self.user,
        )
        create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("1.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("1.00"),
            payments=[{"method": "CASH", "amount": Decimal("11.00")}],
            user=self.user,
        )
        today = timezone.now().date()
        response = self.client.get(
            f"/api/reports/sales/summary/?from={today.isoformat()}&to={today.isoformat()}&group_by=day"
        )
        self.assertEqual(response.status_code, 200)
        payload = response.data["data"]
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["subtotal"], "30.00")
        self.assertEqual(payload[0]["tax_total"], "3.00")
        self.assertEqual(payload[0]["grand_total"], "33.00")

    def test_top_products_ordering(self):
        product_b = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Vitamin",
            sku="DRUG-202",
        )
        Batch.objects.create(
            company=self.company,
            product=product_b,
            warehouse=self.warehouse,
            batch_no="B-REPORT-2",
            expiry_date="2030-01-01",
            purchase_price=Decimal("20.00"),
            selling_price=Decimal("50.00"),
            qty_on_hand=Decimal("10.00"),
        )
        create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[
                {"product": self.product, "qty": Decimal("2.00")},
                {"product": product_b, "qty": Decimal("1.00")},
            ],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("0.00"),
            payments=[{"method": "CASH", "amount": Decimal("70.00")}],
            user=self.user,
        )
        today = timezone.now().date()
        response = self.client.get(
            f"/api/reports/sales/top-products/?from={today.isoformat()}&to={today.isoformat()}&limit=2"
        )
        self.assertEqual(response.status_code, 200)
        payload = response.data["data"]
        self.assertEqual(payload[0]["product_id"], product_b.id)
        self.assertEqual(payload[0]["total_sales"], "50.00")


class ReportsVATTests(TestCase):
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
        Batch.objects.create(
            company=self.company,
            product=self.product,
            warehouse=self.warehouse,
            batch_no="B-VAT-1",
            expiry_date="2030-01-01",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("10.00"),
            qty_on_hand=Decimal("20.00"),
        )
        self.user = get_user_model().objects.create_user(username="accountant", password="pass1234")
        UserProfile.objects.create(
            user=self.user, company=self.company, role=UserProfile.Role.ACCOUNTANT
        )
        call_command("seed_chart_of_accounts")
        output_account = Account.objects.get(company=self.company, code="2100")
        input_account = Account.objects.get(company=self.company, code="1300")
        VATConfig.objects.create(
            company=self.company,
            rate=Decimal("15.00"),
            output_vat_account=output_account,
            input_vat_account=input_account,
        )
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "accountant", "password": "pass1234"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_vat_report_matches_posted_entries(self):
        create_sale_invoice(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            items=[{"product": self.product, "qty": Decimal("1.00")}],
            discount_total=Decimal("0.00"),
            tax_total=Decimal("2.00"),
            payments=[{"method": "CASH", "amount": Decimal("12.00")}],
            user=self.user,
        )
        supplier = Supplier.objects.create(company=self.company, name="Supplier")
        supplier_invoice = create_supplier_invoice(
            company=self.company,
            supplier=supplier,
            warehouse=self.warehouse,
            supplier_invoice_no="SUP-100",
            subtotal=Decimal("10.00"),
            tax_total=Decimal("1.50"),
            ref_grn=None,
            user=self.user,
        )
        post_supplier_invoice(company=self.company, invoice=supplier_invoice, user=self.user)
        today = timezone.now().date()
        response = self.client.get(
            f"/api/reports/finance/vat/?from={today.isoformat()}&to={today.isoformat()}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["output_vat"], "2.00")
        self.assertEqual(response.data["input_vat"], "1.50")
        self.assertEqual(response.data["net_vat"], "0.50")


class ReportsPermissionTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
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

    def test_reports_denied_for_cashier(self):
        today = date.today()
        response = self.client.get(
            f"/api/reports/sales/summary/?from={today.isoformat()}&to={today.isoformat()}"
        )
        self.assertEqual(response.status_code, 403)
