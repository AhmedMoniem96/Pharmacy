from rest_framework import serializers

from .models import RSDTransmissionLog, ZATCAInvoiceLog


class ZATCAInvoiceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZATCAInvoiceLog
        fields = ["id", "ref", "status", "error", "created_at", "sent_at", "payload"]


class RSDTransmissionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSDTransmissionLog
        fields = ["id", "ref", "status", "error", "created_at", "sent_at", "payload"]


class RSDMovementSendSerializer(serializers.Serializer):
    stock_ledger_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=False
    )
    ref_type = serializers.CharField(required=False, allow_blank=False)
    ref_id = serializers.CharField(required=False, allow_blank=False)
    include_non_drug = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        has_ids = "stock_ledger_ids" in attrs
        has_ref = "ref_type" in attrs or "ref_id" in attrs
        if has_ids and has_ref:
            raise serializers.ValidationError(
                "Provide either stock_ledger_ids or ref_type/ref_id, not both."
            )
        if not has_ids and not has_ref:
            raise serializers.ValidationError(
                "Provide stock_ledger_ids or ref_type/ref_id to select movements."
            )
        if has_ref and not (attrs.get("ref_type") and attrs.get("ref_id")):
            raise serializers.ValidationError("Both ref_type and ref_id are required.")
        return attrs
