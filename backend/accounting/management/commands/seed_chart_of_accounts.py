from django.core.management.base import BaseCommand

from accounting.models import Account, Journal
from masterdata.models import Company


class Command(BaseCommand):
    help = "Seed the minimal chart of accounts and journals for each company."

    def handle(self, *args, **options):
        accounts = [
            ("1000", "Cash", Account.Type.ASSET),
            ("1200", "Inventory", Account.Type.ASSET),
            ("1300", "Input VAT", Account.Type.ASSET),
            ("2000", "Accounts Payable", Account.Type.LIABILITY),
            ("2100", "Output VAT", Account.Type.LIABILITY),
            ("4000", "Sales Revenue", Account.Type.INCOME),
            ("5000", "Purchases Expense", Account.Type.EXPENSE),
        ]
        journals = [
            ("SALES", "Sales Journal", Journal.Type.SALES),
            ("PURCHASE", "Purchase Journal", Journal.Type.PURCHASE),
            ("CASH", "Cash Journal", Journal.Type.CASH),
            ("GENERAL", "General Journal", Journal.Type.GENERAL),
        ]
        created_accounts = 0
        created_journals = 0
        for company in Company.objects.all():
            for code, name, acc_type in accounts:
                _, created = Account.objects.get_or_create(
                    company=company,
                    code=code,
                    defaults={"name": name, "type": acc_type, "is_active": True},
                )
                if created:
                    created_accounts += 1
            for code, name, journal_type in journals:
                _, created = Journal.objects.get_or_create(
                    company=company,
                    code=code,
                    defaults={"name": name, "type": journal_type},
                )
                if created:
                    created_journals += 1
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded chart of accounts. Accounts created: {created_accounts}, "
                f"Journals created: {created_journals}."
            )
        )
