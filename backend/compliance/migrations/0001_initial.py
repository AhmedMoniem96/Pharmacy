from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("masterdata", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RSDTransmissionLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ref", models.CharField(max_length=255)),
                ("payload", models.JSONField()),
                ("status", models.CharField(max_length=50)),
                ("error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rsd_logs",
                        to="masterdata.company",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ZATCAInvoiceLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ref", models.CharField(max_length=255)),
                ("payload", models.JSONField()),
                ("status", models.CharField(max_length=50)),
                ("error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="zatca_logs",
                        to="masterdata.company",
                    ),
                ),
            ],
        ),
    ]
