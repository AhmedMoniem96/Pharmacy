from rest_framework import serializers

from .models import Account, Journal, JournalEntry, JournalLine


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "code", "name", "type", "is_active"]


class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Journal
        fields = ["id", "code", "name", "type"]


class JournalLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source="account.code")
    account_name = serializers.CharField(source="account.name")

    class Meta:
        model = JournalLine
        fields = ["id", "account_code", "account_name", "debit", "credit", "memo"]


class JournalEntrySerializer(serializers.ModelSerializer):
    journal_code = serializers.CharField(source="journal.code")
    journal_name = serializers.CharField(source="journal.name")
    created_by = serializers.CharField(source="created_by.username")
    lines = JournalLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = [
            "id",
            "entry_no",
            "journal_code",
            "journal_name",
            "date",
            "memo",
            "ref_type",
            "ref_id",
            "posted",
            "created_at",
            "created_by",
            "lines",
        ]
