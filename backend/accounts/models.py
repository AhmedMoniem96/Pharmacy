from django.conf import settings
from django.db import models

from masterdata.models import Branch, Company, Warehouse


class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Manager"
        CASHIER = "CASHIER", "Cashier"
        INVENTORY = "INVENTORY", "Inventory"
        ACCOUNTANT = "ACCOUNTANT", "Accountant"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="user_profiles")
    role = models.CharField(max_length=20, choices=Role.choices)
    allowed_branches = models.ManyToManyField(Branch, blank=True, related_name="allowed_users")
    allowed_warehouses = models.ManyToManyField(
        Warehouse, blank=True, related_name="allowed_users"
    )
    can_sell_expired = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


def get_user_company(user):
    profile = getattr(user, "profile", None)
    return profile.company if profile else None


def scoped_branches(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return Branch.objects.none()
    if profile.allowed_branches.exists():
        return profile.allowed_branches.all()
    return Branch.objects.filter(company=profile.company)


def scoped_warehouses(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return Warehouse.objects.none()
    if profile.allowed_warehouses.exists():
        return profile.allowed_warehouses.all()
    return Warehouse.objects.filter(branch__company=profile.company)
