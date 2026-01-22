from django.contrib.auth import get_user_model
from django.db import connection, models
from masterdata.models import Company, Branch, Warehouse

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, default="STAFF")
    can_sell_expired = models.BooleanField(default=False)
    timezone = models.CharField(max_length=64, blank=True, default="")

    def __str__(self):
        return f"{self.user.username} - {self.company.name}"

def get_default_company():
    company, _ = Company.objects.get_or_create(name="Main Pharmacy")
    return company

def has_timezone_column():
    try:
        with connection.cursor() as cursor:
            columns = connection.introspection.get_table_description(
                cursor, UserProfile._meta.db_table
            )
        return any(column.name == "timezone" for column in columns)
    except Exception:
        return True


def get_user_profile(user):
    if not user:
        return None
    queryset = UserProfile.objects.filter(user=user)
    if not has_timezone_column():
        queryset = queryset.defer("timezone")
    return queryset.first()


def ensure_user_profile(user):
    profile = get_user_profile(user)
    if profile:
        return profile
    company = get_default_company()
    role = "ADMIN" if user.is_staff or user.is_superuser else "STAFF"
    return UserProfile.objects.create(user=user, company=company, role=role)

def scoped_branches(user):
    profile = get_user_profile(user)
    if profile:
        return Branch.objects.filter(company=profile.company)
    return Branch.objects.none()

def scoped_warehouses(user):
    profile = get_user_profile(user)
    if profile:
        return Warehouse.objects.filter(branch__company=profile.company)
    return Warehouse.objects.none()

def get_user_company(user):
    profile = get_user_profile(user)
    return profile.company if profile else None

class AuditLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    summary = models.TextField()

    def __str__(self):
        return f"{self.timestamp} - {self.action} - {self.entity_type}"
