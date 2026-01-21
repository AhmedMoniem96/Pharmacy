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
    account_code = serializers.CharField(source="account.code", read_only=True)
    account_name = serializers.CharField(source="account.name", read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(), source="account", write_only=True
    )

    class Meta:
        model = JournalLine
        fields = ["id", "account_id", "account_code", "account_name", "debit", "credit", "memo"]


class JournalEntrySerializer(serializers.ModelSerializer):
    journal_code = serializers.CharField(source="journal.code", read_only=True)
    journal_name = serializers.CharField(source="journal.name", read_only=True)
    created_by = serializers.CharField(source="created_by.username", read_only=True)
    journal_id = serializers.PrimaryKeyRelatedField(
        queryset=Journal.objects.all(), source="journal", write_only=True
    )
    lines = JournalLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = [
            "id",
            "entry_no",
            "journal_id",
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

    def create(self, validated_data):
        lines_data = validated_data.pop("lines")
        entry = JournalEntry.objects.create(**validated_data)
        
        for line_data in lines_data:
            JournalLine.objects.create(entry=entry, **line_data)
            
        return entry
