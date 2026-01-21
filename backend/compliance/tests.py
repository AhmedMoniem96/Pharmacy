from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import UserProfile
from inventory.services import receive_stock
from masterdata.models import Branch, Company, Product, Warehouse
from sales.models import Payment, SaleInvoice, SaleItem

from .models import RSDTransmissionLog, ZATCAInvoiceLog


class ComplianceEndpointTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Pharmacy")
        self.branch = Branch.objects.create(company=self.company, name="Main", code="MAIN")
        self.warehouse = Warehouse.objects.create(
            branch=self.branch, name="Main Warehouse", code="MAIN-WH"
        )
        self.drug = Product.objects.create(
            company=self.company,
            type=Product.ProductType.DRUG,
            name="Test Drug",
            sku="DRUG-001",
            reorder_level=Decimal("10.00"),
        )
        self.non_drug = Product.objects.create(
            company=self.company,
            type=Product.ProductType.NON_DRUG,
            name="Bandage",
            sku="NON-001",
            reorder_level=Decimal("5.00"),
        )
        self.admin_user = get_user_model().objects.create_user(
            username="admin", password="pass1234"
        )
        UserProfile.objects.create(
            user=self.admin_user, company=self.company, role=UserProfile.Role.ADMIN
        )
        self.cashier_user = get_user_model().objects.create_user(
            username="cashier", password="pass1234"
        )
        UserProfile.objects.create(
            user=self.cashier_user, company=self.company, role=UserProfile.Role.CASHIER
        )
        self.client = APIClient()

    def authenticate(self, username, password):
        response = self.client.post(
            "/api/auth/token/",
            {"username": username, "password": password},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_zatca_send_creates_log_with_payload_and_sent_status(self):
        invoice = SaleInvoice.objects.create(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            invoice_no="20260121-0001",
            invoice_date=timezone.now().date(),
            sequence=1,
            created_by=self.admin_user,
            status=SaleInvoice.Status.PAID,
            kind=SaleInvoice.Kind.SALE,
            subtotal=Decimal("20.00"),
            discount_total=Decimal("1.00"),
            tax_total=Decimal("0.50"),
            grand_total=Decimal("19.50"),
        )
        SaleItem.objects.create(
            invoice=invoice,
            product=self.drug,
            qty=Decimal("2.00"),
            unit_price=Decimal("10.00"),
            line_total=Decimal("20.00"),
        )
        Payment.objects.create(
            invoice=invoice,
            method=Payment.Method.CASH,
            amount=Decimal("19.50"),
        )
        self.authenticate("admin", "pass1234")
        response = self.client.post(
            f"/api/compliance/zatca/invoices/{invoice.id}/send/",
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        log = ZATCAInvoiceLog.objects.get(id=response.data["id"])
        self.assertEqual(log.status, "SENT")
        self.assertIsNotNone(log.sent_at)
        self.assertEqual(log.payload["invoice_no"], invoice.invoice_no)
        self.assertEqual(log.payload["totals"]["grand_total"], str(invoice.grand_total))

    def test_rsd_send_by_ref_creates_log_from_ledger_rows(self):
        receive_stock(
            company=self.company,
            warehouse=self.warehouse,
            items=[
                {
                    "product": self.drug,
                    "batch_no": "B-2",
                    "expiry_date": "2030-01-01",
                    "purchase_price": Decimal("5.00"),
                    "selling_price": Decimal("10.00"),
                    "qty": Decimal("5.00"),
                },
                {
                    "product": self.non_drug,
                    "batch_no": "B-3",
                    "expiry_date": "2030-01-01",
                    "purchase_price": Decimal("2.00"),
                    "selling_price": Decimal("4.00"),
                    "qty": Decimal("3.00"),
                },
            ],
            ref_type="GRN",
            ref_id="GRN-1",
            user=self.admin_user,
        )
        self.authenticate("admin", "pass1234")
        response = self.client.post(
            "/api/compliance/rsd/movements/send/",
            {"ref_type": "GRN", "ref_id": "GRN-1"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        log = RSDTransmissionLog.objects.get(id=response.data["id"])
        self.assertEqual(log.status, "SENT")
        rows = log.payload["rows"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["product_type"], Product.ProductType.DRUG)

    def test_rsd_send_by_ids_creates_log(self):
        receive_stock(
            company=self.company,
            warehouse=self.warehouse,
            items=[
                {
                    "product": self.drug,
                    "batch_no": "B-4",
                    "expiry_date": "2030-01-01",
                    "purchase_price": Decimal("5.00"),
                    "selling_price": Decimal("10.00"),
                    "qty": Decimal("5.00"),
                }
            ],
            ref_type="TRANSFER",
            ref_id="TR-1",
            user=self.admin_user,
        )
        ledger_ids = list(
            self.company.stock_ledgers.filter(ref_type="TRANSFER", ref_id="TR-1").values_list(
                "id", flat=True
            )
        )
        self.authenticate("admin", "pass1234")
        response = self.client.post(
            "/api/compliance/rsd/movements/send/",
            {"stock_ledger_ids": ledger_ids},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        log = RSDTransmissionLog.objects.get(id=response.data["id"])
        self.assertEqual(log.status, "SENT")
        self.assertEqual(len(log.payload["rows"]), len(ledger_ids))

    def test_permissions_cashier_denied(self):
        invoice = SaleInvoice.objects.create(
            company=self.company,
            branch=self.branch,
            warehouse=self.warehouse,
            invoice_no="20260121-0002",
            invoice_date=timezone.now().date(),
            sequence=2,
            created_by=self.admin_user,
            status=SaleInvoice.Status.PAID,
            kind=SaleInvoice.Kind.SALE,
            subtotal=Decimal("10.00"),
            discount_total=Decimal("0.00"),
            tax_total=Decimal("0.00"),
            grand_total=Decimal("10.00"),
        )
        SaleItem.objects.create(
            invoice=invoice,
            product=self.drug,
            qty=Decimal("1.00"),
            unit_price=Decimal("10.00"),
            line_total=Decimal("10.00"),
        )
        Payment.objects.create(
            invoice=invoice,
            method=Payment.Method.CASH,
            amount=Decimal("10.00"),
        )
        self.authenticate("cashier", "pass1234")
        response = self.client.post(
            f"/api/compliance/zatca/invoices/{invoice.id}/send/",
            format="json",
        )
        self.assertEqual(response.status_code, 403)
