from django.conf import settings
from django.db import models

from masterdata.models import Company


class ReportSavedView(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="report_views")
    name = models.CharField(max_length=255)
    filters = models.JSONField(default=dict)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="report_views"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.company.name})"


class ReportSchedule(models.Model):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="report_schedules"
    )
    name = models.CharField(max_length=255)
    filters = models.JSONField(default=dict)
    cadence = models.CharField(max_length=50)
    recipients = models.JSONField(default=list)
    next_run_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="report_schedules"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.company.name})"
