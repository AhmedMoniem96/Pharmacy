from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class Branch(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="branches")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["company", "code"], name="unique_branch_code_per_company"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class Warehouse(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="warehouses")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["branch", "code"], name="unique_warehouse_code_per_branch"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class Category(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children"
    )

    def __str__(self) -> str:
        return self.name


class Manufacturer(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    class ProductType(models.TextChoices):
        DRUG = "DRUG", "Drug"
        NON_DRUG = "NON_DRUG", "Non-drug"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="products")
    type = models.CharField(max_length=20, choices=ProductType.choices)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.CharField(max_length=50, default="pcs")
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["company", "sku"], name="unique_product_sku_per_company"),
            models.UniqueConstraint(
                fields=["company", "barcode"], name="unique_product_barcode_per_company"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.sku})"
