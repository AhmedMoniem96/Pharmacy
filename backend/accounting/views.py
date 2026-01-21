from accounts.mixins import CompanyScopedReadOnlyModelViewSet
from accounts.permissions import AccountingPermission

from .models import Account, Journal, JournalEntry
from .serializers import AccountSerializer, JournalEntrySerializer, JournalSerializer


class AccountViewSet(CompanyScopedReadOnlyModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [AccountingPermission]

    def get_queryset(self):
        queryset = Account.objects.filter(is_active=True).order_by("code")
        return self.filter_company_queryset(queryset)


class JournalViewSet(CompanyScopedReadOnlyModelViewSet):
    serializer_class = JournalSerializer
    permission_classes = [AccountingPermission]

    def get_queryset(self):
        queryset = Journal.objects.all().order_by("code")
        return self.filter_company_queryset(queryset)


class JournalEntryViewSet(CompanyScopedReadOnlyModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [AccountingPermission]

    def get_queryset(self):
        queryset = (
            JournalEntry.objects.select_related("journal", "created_by")
            .prefetch_related("lines__account")
            .order_by("-date", "-entry_no")
        )
        return self.filter_company_queryset(queryset)
