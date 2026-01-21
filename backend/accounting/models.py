from django.db import models
from django.conf import settings
from masterdata.models import Company

class Account(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)  # e.g., ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Journal(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)  # e.g., GENERAL, SALES, PURCHASE, CASH

    def __str__(self):
        return self.name

class JournalEntry(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    journal = models.ForeignKey(Journal, on_delete=models.PROTECT)
    entry_no = models.CharField(max_length=50)
    date = models.DateField()
    memo = models.TextField(blank=True)
    ref_type = models.CharField(max_length=50, blank=True, null=True)
    ref_id = models.CharField(max_length=50, blank=True, null=True)
    posted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def __str__(self):
        return self.entry_no

class JournalLine(models.Model):
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    memo = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.account.code} ({self.debit} | {self.credit})"