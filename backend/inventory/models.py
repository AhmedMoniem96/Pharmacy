from django.conf import settings
from django.db import models
from masterdata.models import Company, Product, Warehouse

class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='batches', null=True, blank=True)
    batch_no = models.CharField(max_length=100)
    expiry_date = models.DateField(null=True, blank=True)
    qty_on_hand = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    @property
    def company(self):
        return self.product.company

    def __str__(self):
        return self.batch_no

class StockLedger(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True)
    qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    movement_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    ref_type = models.CharField(max_length=50, null=True, blank=True)
    ref_id = models.CharField(max_length=50, null=True, blank=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.movement_type} - {self.product.name}"