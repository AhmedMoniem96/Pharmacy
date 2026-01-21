from decimal import Decimal

from django.conf import settings
from django.db import models

from masterdata.models import Branch, Company, Product, Warehouse


class Supplier(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="suppliers")
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.company.name})"


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent"
        RECEIVED = "RECEIVED", "Received"
        CANCELED = "CANCELED", "Canceled"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="purchase_orders")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="purchase_orders")
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="purchase_orders"
    )
    po_no = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="purchase_orders"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "po_no"],
                name="unique_po_no_per_company",
            )
        ]

    def __str__(self) -> str:
        return f"{self.po_no} ({self.company.name})"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="purchase_items")
    qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.purchase_order.po_no} - {self.product.name}"


class GoodsReceipt(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        POSTED = "POSTED", "Posted"
        CANCELED = "CANCELED", "Canceled"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="goods_receipts")
    supplier = models.ForeignKey(
        Supplier, on_delete=models.PROTECT, related_name="goods_receipts"
    )
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="goods_receipts"
    )
    grn_no = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    received_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="goods_receipts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    ref_po = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="goods_receipts",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "grn_no"],
                name="unique_grn_no_per_company",
            )
        ]

    def __str__(self) -> str:
        return f"{self.grn_no} ({self.company.name})"


class GoodsReceiptItem(models.Model):
    goods_receipt = models.ForeignKey(
        GoodsReceipt, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="grn_items")
    batch_no = models.CharField(max_length=100)
    expiry_date = models.DateField()
    qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    def __str__(self) -> str:
        return f"{self.goods_receipt.grn_no} - {self.product.name}"


class SupplierInvoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        POSTED = "POSTED", "Posted"
        CANCELED = "CANCELED", "Canceled"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="supplier_invoices")
    supplier = models.ForeignKey(
        Supplier, on_delete=models.PROTECT, related_name="supplier_invoices"
    )
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="supplier_invoices"
    )
    supplier_invoice_no = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    ref_grn = models.ForeignKey(
        GoodsReceipt,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplier_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="supplier_invoices"
    )

    def __str__(self) -> str:
        return f"{self.supplier_invoice_no} ({self.company.name})"
