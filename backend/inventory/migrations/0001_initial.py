from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("masterdata", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Batch",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("batch_no", models.CharField(max_length=100)),
                ("expiry_date", models.DateField()),
                ("purchase_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("selling_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("qty_on_hand", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="batches",
                        to="masterdata.company",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="batches",
                        to="masterdata.product",
                    ),
                ),
                (
                    "warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="batches",
                        to="masterdata.warehouse",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["company", "warehouse", "product"], name="inventory_ba_company_e7af22_idx"),
                    models.Index(fields=["expiry_date"], name="inventory_ba_expiry__3b3cdf_idx"),
                    models.Index(fields=["batch_no"], name="inventory_ba_batch_n_8ff196_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="StockLedger",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "movement_type",
                    models.CharField(
                        choices=[
                            ("IN", "In"),
                            ("OUT", "Out"),
                            ("ADJUST", "Adjust"),
                            ("TRANSFER", "Transfer"),
                            ("SALE", "Sale"),
                            ("RETURN", "Return"),
                        ],
                        max_length=20,
                    ),
                ),
                ("qty", models.DecimalField(decimal_places=2, max_digits=12)),
                ("unit_cost", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("ref_type", models.CharField(max_length=100)),
                ("ref_id", models.CharField(max_length=100)),
                ("note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "batch",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="stock_ledgers",
                        to="inventory.batch",
                    ),
                ),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stock_ledgers",
                        to="masterdata.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stock_ledgers",
                        to="masterdata.product",
                    ),
                ),
                (
                    "warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stock_ledgers",
                        to="masterdata.warehouse",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["company", "warehouse", "product"], name="inventory_st_company_a381f9_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="batch",
            constraint=models.UniqueConstraint(
                fields=("company", "product", "warehouse", "batch_no"),
                name="unique_batch_per_location",
            ),
        ),
    ]
