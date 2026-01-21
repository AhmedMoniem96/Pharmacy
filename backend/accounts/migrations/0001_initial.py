from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("masterdata", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("ADMIN", "Admin"),
                            ("MANAGER", "Manager"),
                            ("CASHIER", "Cashier"),
                            ("INVENTORY", "Inventory"),
                            ("ACCOUNTANT", "Accountant"),
                        ],
                        max_length=20,
                    ),
                ),
                ("can_sell_expired", models.BooleanField(default=False)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_profiles",
                        to="masterdata.company",
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="userprofile",
            name="allowed_branches",
            field=models.ManyToManyField(blank=True, related_name="allowed_users", to="masterdata.branch"),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="allowed_warehouses",
            field=models.ManyToManyField(blank=True, related_name="allowed_users", to="masterdata.warehouse"),
        ),
    ]
