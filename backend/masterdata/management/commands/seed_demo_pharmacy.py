import os
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import UserProfile
from inventory.models import Batch
from masterdata.models import Branch, Company, Product, Warehouse


class Command(BaseCommand):
    help = "Seed a demo pharmacy dataset."

    def handle(self, *args, **options):
        admin_username = os.environ.get("DEMO_ADMIN_USERNAME", "admin")
        admin_password = os.environ.get("DEMO_ADMIN_PASSWORD", "admin123")
        cashier_username = os.environ.get("DEMO_CASHIER_USERNAME", "cashier")
        cashier_password = os.environ.get("DEMO_CASHIER_PASSWORD", "cashier123")

        company, _ = Company.objects.get_or_create(name="Demo Pharmacy")
        branch, _ = Branch.objects.get_or_create(
            company=company,
            code="MAIN",
            defaults={"name": "Main Branch", "address": "Riyadh"},
        )
        warehouse, _ = Warehouse.objects.get_or_create(
            branch=branch,
            code="MAIN-WH",
            defaults={"name": "Main Warehouse"},
        )

        products = [
            ("DRUG", "Paracetamol 500mg", "PARA-500"),
            ("DRUG", "Ibuprofen 200mg", "IBU-200"),
            ("DRUG", "Amoxicillin 250mg", "AMOX-250"),
            ("NON_DRUG", "Bandages Pack", "BAND-001"),
            ("NON_DRUG", "Vitamin C 1000mg", "VITC-1000"),
        ]
        created_products = []
        for product_type, name, sku in products:
            product, _ = Product.objects.get_or_create(
                company=company,
                sku=sku,
                defaults={"name": name, "type": product_type},
            )
            created_products.append(product)

        for index, product in enumerate(created_products, start=1):
            Batch.objects.get_or_create(
                company=company,
                product=product,
                warehouse=warehouse,
                batch_no=f"BATCH-{index:03d}",
                defaults={
                    "expiry_date": date.today() + timedelta(days=365 + index * 30),
                    "purchase_price": Decimal("10.00") + Decimal(index),
                    "selling_price": Decimal("15.00") + Decimal(index),
                    "qty_on_hand": Decimal("100.00"),
                },
            )

        User = get_user_model()
        admin_user, _ = User.objects.get_or_create(username=admin_username)
        if not admin_user.check_password(admin_password):
            admin_user.set_password(admin_password)
            admin_user.is_staff = True
            admin_user.save(update_fields=["password", "is_staff"])

        cashier_user, _ = User.objects.get_or_create(username=cashier_username)
        if not cashier_user.check_password(cashier_password):
            cashier_user.set_password(cashier_password)
            cashier_user.save(update_fields=["password"])

        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                "company": company,
                "role": UserProfile.Role.ADMIN,
                "can_sell_expired": False,
            },
        )
        UserProfile.objects.get_or_create(
            user=cashier_user,
            defaults={
                "company": company,
                "role": UserProfile.Role.CASHIER,
                "can_sell_expired": False,
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo pharmacy data seeded."))
