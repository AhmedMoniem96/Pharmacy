from decimal import Decimal

from django.conf import settings
from django.db import models

from masterdata.models import Company


class Account(models.Model):
    class Type(models.TextChoices):
        ASSET = "ASSET", "Asset"
        LIABILITY = "LIABILITY", "Liability"
        EQUITY = "EQUITY", "Equity"
        INCOME = "INCOME", "Income"
        EXPENSE = "EXPENSE", "Expense"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="accounts")
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=Type.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"],
                name="unique_account_code_per_company",
            )
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class Journal(models.Model):
    class Type(models.TextChoices):
        SALES = "SALES", "Sales"
        PURCHASE = "PURCHASE", "Purchase"
        CASH = "CASH", "Cash"
        GENERAL = "GENERAL", "General"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="journals")
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=Type.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"],
                name="unique_journal_code_per_company",
            )
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class JournalEntry(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="journal_entries")
    journal = models.ForeignKey(Journal, on_delete=models.PROTECT, related_name="entries")
    entry_no = models.PositiveIntegerField()
    date = models.DateField()
    memo = models.CharField(max_length=255, blank=True, null=True)
    ref_type = models.CharField(max_length=50, blank=True, null=True)
    ref_id = models.CharField(max_length=50, blank=True, null=True)
    posted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="journal_entries"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "entry_no"],
                name="unique_entry_no_per_company",
            )
        ]

    def __str__(self) -> str:
        return f"{self.entry_no} ({self.company.name})"


class JournalLine(models.Model):
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name="lines")
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="journal_lines")
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    memo = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=~(models.Q(debit__gt=0) & models.Q(credit__gt=0)),
                name="journal_line_debit_credit_not_both",
            )
        ]

    def __str__(self) -> str:
        return f"{self.entry.entry_no} - {self.account.code}"


class VATConfig(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name="vat_config")
    rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    output_vat_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="output_vat_configs",
    )
    input_vat_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="input_vat_configs",
    )

    def __str__(self) -> str:
        return f"VAT {self.rate} ({self.company.name})"
