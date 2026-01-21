from rest_framework import viewsets

from accounts.models import get_user_company
from accounts.permissions import AccountingPermission

from .models import Account, Journal, JournalEntry
from .serializers import AccountSerializer, JournalEntrySerializer, JournalSerializer


class AccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [AccountingPermission]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return Account.objects.none()
        return Account.objects.filter(company=company, is_active=True).order_by("code")


class JournalViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JournalSerializer
    permission_classes = [AccountingPermission]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return Journal.objects.none()
        return Journal.objects.filter(company=company).order_by("code")


class JournalEntryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [AccountingPermission]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return JournalEntry.objects.none()
        return (
            JournalEntry.objects.filter(company=company)
            .select_related("journal", "created_by")
            .prefetch_related("lines__account")
            .order_by("-date", "-entry_no")
        )
