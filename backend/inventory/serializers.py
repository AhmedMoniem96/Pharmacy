from decimal import Decimal

from rest_framework import serializers

from accounts.models import get_user_company
from masterdata.models import Product, Warehouse

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


class ReceiveStockItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    batch_no = serializers.CharField(max_length=100)
    expiry_date = serializers.DateField()
    purchase_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    selling_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))


class ReceiveStockSerializer(serializers.Serializer):
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    ref_type = serializers.CharField(max_length=100)
    ref_id = serializers.CharField(max_length=100)
    note = serializers.CharField(required=False, allow_blank=True)
    items = ReceiveStockItemSerializer(many=True)

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        warehouse = attrs.get("warehouse")
        if warehouse.branch.company_id != company.id:
            raise serializers.ValidationError("Warehouse does not belong to your company.")
        for item in attrs.get("items", []):
            if item["product"].company_id != company.id:
                raise serializers.ValidationError("Product does not belong to your company.")
        return attrs


class SellStockItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))


class SellStockSerializer(serializers.Serializer):
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    ref_type = serializers.CharField(max_length=100)
    ref_id = serializers.CharField(max_length=100)
    allow_expired = serializers.BooleanField(required=False, default=False)
    items = SellStockItemSerializer(many=True)

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        warehouse = attrs.get("warehouse")
        if warehouse.branch.company_id != company.id:
            raise serializers.ValidationError("Warehouse does not belong to your company.")
        for item in attrs.get("items", []):
            if item["product"].company_id != company.id:
                raise serializers.ValidationError("Product does not belong to your company.")
        return attrs


class BatchQtyItemSerializer(serializers.Serializer):
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all())
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))


class AdjustStockItemSerializer(serializers.Serializer):
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all())
    qty = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_qty(self, value):
        if value == 0:
            raise serializers.ValidationError("Adjustment quantity cannot be zero.")
        return value


class ReturnStockSerializer(serializers.Serializer):
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    ref_type = serializers.CharField(max_length=100)
    ref_id = serializers.CharField(max_length=100)
    note = serializers.CharField(required=False, allow_blank=True)
    items = BatchQtyItemSerializer(many=True)

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        warehouse = attrs.get("warehouse")
        if warehouse.branch.company_id != company.id:
            raise serializers.ValidationError("Warehouse does not belong to your company.")
        for item in attrs.get("items", []):
            batch = item["batch"]
            if batch.company_id != company.id or batch.warehouse_id != warehouse.id:
                raise serializers.ValidationError("Batch does not belong to your warehouse.")
        return attrs


class TransferStockSerializer(serializers.Serializer):
    from_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    to_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    ref_type = serializers.CharField(max_length=100)
    ref_id = serializers.CharField(max_length=100)
    note = serializers.CharField(required=False, allow_blank=True)
    items = BatchQtyItemSerializer(many=True)

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        from_warehouse = attrs.get("from_warehouse")
        to_warehouse = attrs.get("to_warehouse")
        if from_warehouse.branch.company_id != company.id or to_warehouse.branch.company_id != company.id:
            raise serializers.ValidationError("Warehouse does not belong to your company.")
        if from_warehouse.id == to_warehouse.id:
            raise serializers.ValidationError("Source and destination warehouses must differ.")
        for item in attrs.get("items", []):
            batch = item["batch"]
            if batch.company_id != company.id or batch.warehouse_id != from_warehouse.id:
                raise serializers.ValidationError("Batch does not belong to source warehouse.")
        return attrs


class AdjustStockSerializer(serializers.Serializer):
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    reason = serializers.CharField(max_length=255)
    items = AdjustStockItemSerializer(many=True)

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        warehouse = attrs.get("warehouse")
        if warehouse.branch.company_id != company.id:
            raise serializers.ValidationError("Warehouse does not belong to your company.")
        for item in attrs.get("items", []):
            batch = item["batch"]
            if batch.company_id != company.id or batch.warehouse_id != warehouse.id:
                raise serializers.ValidationError("Batch does not belong to your warehouse.")
        return attrs
