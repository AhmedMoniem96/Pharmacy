from rest_framework import serializers

from accounts.models import get_user_company

from .models import Batch, StockLedger


class BatchSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Batch
        fields = (
            "id",
            "company",
            "product",
            "warehouse",
            "batch_no",
            "expiry_date",
            "purchase_price",
            "selling_price",
            "qty_on_hand",
        )

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        product = attrs.get("product")
        warehouse = attrs.get("warehouse")
        if product and product.company_id != company.id:
            raise serializers.ValidationError("Product does not belong to your company.")
        if warehouse and warehouse.branch.company_id != company.id:
            raise serializers.ValidationError("Warehouse does not belong to your company.")
        return attrs


class StockLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLedger
        fields = (
            "id",
            "company",
            "warehouse",
            "product",
            "batch",
            "movement_type",
            "qty",
            "unit_cost",
            "ref_type",
            "ref_id",
            "note",
            "created_by",
            "created_at",
        )
        read_only_fields = fields
