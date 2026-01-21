from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Account, Journal, JournalEntry
from .serializers import AccountSerializer, JournalSerializer, JournalEntrySerializer


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter accounts by the logged-in user's company
        return Account.objects.filter(company=self.request.user.profile.company)

    def perform_create(self, serializer):
        # Automatically assign the company
        serializer.save(company=self.request.user.profile.company)


class JournalViewSet(viewsets.ModelViewSet):
    serializer_class = JournalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Journal.objects.filter(company=self.request.user.profile.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.profile.company)


class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(company=self.request.user.profile.company)

    def perform_create(self, serializer):
        # Assign company and creator
        serializer.save(company=self.request.user.profile.company, created_by=self.request.user)