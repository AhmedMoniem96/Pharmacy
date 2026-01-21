from django.db import models

from masterdata.models import Company


class ZATCAInvoiceLog(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="zatca_logs")
    ref = models.CharField(max_length=255)
    payload = models.JSONField()
    status = models.CharField(max_length=50)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"ZATCA {self.ref} ({self.status})"


class RSDTransmissionLog(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="rsd_logs")
    ref = models.CharField(max_length=255)
    payload = models.JSONField()
    status = models.CharField(max_length=50)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"RSD {self.ref} ({self.status})"
