from decimal import Decimal

from rest_framework import serializers

from accounts.models import get_user_company
from masterdata.models import Branch, Product, Warehouse

from .models import Payment, SaleInvoice, SaleItem


class SaleItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        if attrs["qty"] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return attrs


class PaymentInputSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=Payment.Method.choices)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    reference = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if attrs["amount"] <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return attrs


class SaleCreateSerializer(serializers.Serializer):
    branch_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    items = SaleItemInputSerializer(many=True)
    discount_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    tax_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    payments = PaymentInputSerializer(many=True, required=False, allow_null=True)

    def validate(self, attrs):
        company = get_user_company(self.context["request"].user)
        branch = Branch.objects.filter(id=attrs["branch_id"], company=company).first()
        if not branch:
            raise serializers.ValidationError("Branch not in your company.")
        warehouse = Warehouse.objects.filter(id=attrs["warehouse_id"], branch=branch).first()
        if not warehouse:
            raise serializers.ValidationError("Warehouse does not belong to branch.")
        attrs["branch"] = branch
        attrs["warehouse"] = warehouse
        product_ids = [item["product_id"] for item in attrs["items"]]
        products = Product.objects.filter(company=company, id__in=product_ids)
        if products.count() != len(product_ids):
            raise serializers.ValidationError("One or more products are invalid.")
        product_map = {product.id: product for product in products}
        attrs["items"] = [
            {"product": product_map[item["product_id"]], "qty": item["qty"]}
            for item in attrs["items"]
        ]
        return attrs


class PaymentCreateSerializer(serializers.Serializer):
    payments = PaymentInputSerializer(many=True)


class ReturnItemInputSerializer(serializers.Serializer):
    sale_item_id = serializers.IntegerField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        if attrs["qty"] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return attrs


class ReturnCreateSerializer(serializers.Serializer):
    items = ReturnItemInputSerializer(many=True)

    def validate(self, attrs):
        sale_item_ids = [item["sale_item_id"] for item in attrs["items"]]
        sale_items = SaleItem.objects.filter(id__in=sale_item_ids).select_related("invoice")
        if sale_items.count() != len(sale_item_ids):
            raise serializers.ValidationError("One or more sale items are invalid.")
        sale_item_map = {sale_item.id: sale_item for sale_item in sale_items}
        attrs["items"] = [
            {"sale_item": sale_item_map[item["sale_item_id"]], "qty": item["qty"]}
            for item in attrs["items"]
        ]
        return attrs


class SaleItemReceiptSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name")
    sku = serializers.CharField(source="product.sku")
    batch_no = serializers.CharField(source="batch.batch_no", allow_null=True)

    class Meta:
        model = SaleItem
        fields = [
            "product_id",
            "product_name",
            "sku",
            "batch_no",
            "qty",
            "unit_price",
            "line_total",
        ]


class PaymentReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["method", "amount", "reference", "created_at"]


class SaleInvoiceReceiptSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name")
    warehouse_name = serializers.CharField(source="warehouse.name")
    created_by = serializers.CharField(source="created_by.username")
    items = SaleItemReceiptSerializer(many=True)
    payments = PaymentReceiptSerializer(many=True)

    class Meta:
        model = SaleInvoice
        fields = [
            "id",
            "invoice_no",
            "invoice_date",
            "status",
            "kind",
            "branch_id",
            "branch_name",
            "warehouse_id",
            "warehouse_name",
            "created_by",
            "created_at",
            "subtotal",
            "discount_total",
            "tax_total",
            "grand_total",
            "items",
            "payments",
        ]
