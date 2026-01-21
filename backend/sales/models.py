from decimal import Decimal

from django.conf import settings
from django.db import models

from inventory.models import Batch
from masterdata.models import Branch, Company, Product, Warehouse


class SaleInvoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PAID = "PAID", "Paid"
        PARTIAL = "PARTIAL", "Partial"
        VOID = "VOID", "Void"
        RETURNED = "RETURNED", "Returned"

    class Kind(models.TextChoices):
        SALE = "SALE", "Sale"
        RETURN = "RETURN", "Return"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="sale_invoices")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="sale_invoices")
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="sale_invoices"
    )
    invoice_no = models.CharField(max_length=30)
    invoice_date = models.DateField()
    sequence = models.PositiveIntegerField(default=1)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.SALE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sale_invoices"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    original_invoice = models.ForeignKey(
        "self", on_delete=models.PROTECT, null=True, blank=True, related_name="returns"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "invoice_no"],
                name="unique_sale_invoice_no_per_company",
            )
        ]

    def __str__(self) -> str:
        return f"{self.invoice_no} ({self.company.name})"


class SaleItem(models.Model):
    invoice = models.ForeignKey(SaleInvoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    batch = models.ForeignKey(
        Batch, on_delete=models.PROTECT, related_name="sale_items", null=True, blank=True
    )
    qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.invoice.invoice_no} - {self.product.name}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        CARD = "CARD", "Card"
        WALLET = "WALLET", "Wallet"
        TRANSFER = "TRANSFER", "Transfer"

    invoice = models.ForeignKey(SaleInvoice, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=20, choices=Method.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.invoice.invoice_no} - {self.method}"
