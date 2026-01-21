from django.conf import settings
from django.db import models

from masterdata.models import Company, Product, Warehouse


class Batch(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="batches")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="batches")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="batches")
    batch_no = models.CharField(max_length=100)
    expiry_date = models.DateField()
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    qty_on_hand = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [
            models.Index(fields=["company", "warehouse", "product"]),
            models.Index(fields=["expiry_date"]),
            models.Index(fields=["batch_no"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "product", "warehouse", "batch_no"],
                name="unique_batch_per_location",
            )
        ]

    def __str__(self) -> str:
        return f"{self.product} - {self.batch_no}"


class StockLedger(models.Model):
    class MovementType(models.TextChoices):
        IN = "IN", "In"
        OUT = "OUT", "Out"
        ADJUST = "ADJUST", "Adjust"
        TRANSFER = "TRANSFER", "Transfer"
        SALE = "SALE", "Sale"
        RETURN = "RETURN", "Return"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="stock_ledgers")
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.CASCADE, related_name="stock_ledgers"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_ledgers")
    batch = models.ForeignKey(
        Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name="stock_ledgers"
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    ref_type = models.CharField(max_length=100)
    ref_id = models.CharField(max_length=100)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["company", "warehouse", "product"]),
        ]

    def __str__(self) -> str:
        return f"{self.movement_type} {self.product} ({self.qty})"
