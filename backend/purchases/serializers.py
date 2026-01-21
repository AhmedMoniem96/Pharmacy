from decimal import Decimal

from rest_framework import serializers

from accounts.models import get_user_company, scoped_branches, scoped_warehouses
from masterdata.models import Product

from .models import (
    GoodsReceipt,
    GoodsReceiptItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
    SupplierInvoice,
)
from .services import create_purchase_order, create_supplier_invoice


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "phone", "email", "address", "is_active"]


class PurchaseOrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        if attrs["qty"] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        if attrs["unit_cost"] <= 0:
            raise serializers.ValidationError("Unit cost must be greater than zero.")
        return attrs


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name")
    sku = serializers.CharField(source="product.sku")

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "product_id", "product_name", "sku", "qty", "unit_cost", "line_total"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name")
    warehouse_name = serializers.CharField(source="warehouse.name")
    created_by = serializers.CharField(source="created_by.username")
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_no",
            "status",
            "branch_id",
            "branch_name",
            "warehouse_id",
            "warehouse_name",
            "subtotal",
            "discount_total",
            "tax_total",
            "grand_total",
            "created_by",
            "created_at",
            "items",
        ]


class PurchaseOrderUpsertSerializer(serializers.Serializer):
    branch_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    items = PurchaseOrderItemInputSerializer(many=True)
    discount_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    tax_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    status = serializers.ChoiceField(
        choices=PurchaseOrder.Status.choices, required=False, allow_null=True
    )

    def validate(self, attrs):
        request = self.context["request"]
        company = get_user_company(request.user)
        branch = scoped_branches(request.user).filter(id=attrs["branch_id"]).first()
        if not branch:
            raise serializers.ValidationError("Branch not in your scope.")
        warehouse = scoped_warehouses(request.user).filter(id=attrs["warehouse_id"]).first()
        if not warehouse or warehouse.branch_id != branch.id:
            raise serializers.ValidationError("Warehouse does not belong to branch.")
        attrs["branch"] = branch
        attrs["warehouse"] = warehouse
        product_ids = [item["product_id"] for item in attrs["items"]]
        products = Product.objects.filter(company=company, id__in=product_ids)
        if products.count() != len(product_ids):
            raise serializers.ValidationError("One or more products are invalid.")
        product_map = {product.id: product for product in products}
        attrs["items"] = [
            {
                "product": product_map[item["product_id"]],
                "qty": item["qty"],
                "unit_cost": item["unit_cost"],
            }
            for item in attrs["items"]
        ]
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return create_purchase_order(
            company=get_user_company(request.user),
            branch=validated_data["branch"],
            warehouse=validated_data["warehouse"],
            items=validated_data["items"],
            discount_total=validated_data.get("discount_total"),
            tax_total=validated_data.get("tax_total"),
            user=request.user,
        )

    def update(self, instance, validated_data):
        if instance.status != PurchaseOrder.Status.DRAFT:
            raise serializers.ValidationError("Only draft purchase orders can be updated.")
        items = validated_data.get("items")
        discount_total = validated_data.get("discount_total", instance.discount_total)
        tax_total = validated_data.get("tax_total", instance.tax_total)
        if items is not None:
            instance.items.all().delete()
            po_items = []
            subtotal = Decimal("0.00")
            for item in items:
                line_total = (item["qty"] * item["unit_cost"]).quantize(Decimal("0.01"))
                subtotal += line_total
                po_items.append(
                    PurchaseOrderItem(
                        purchase_order=instance,
                        product=item["product"],
                        qty=item["qty"],
                        unit_cost=item["unit_cost"],
                        line_total=line_total,
                    )
                )
            PurchaseOrderItem.objects.bulk_create(po_items)
            instance.subtotal = subtotal
        instance.branch = validated_data.get("branch", instance.branch)
        instance.warehouse = validated_data.get("warehouse", instance.warehouse)
        instance.discount_total = discount_total
        instance.tax_total = tax_total
        instance.status = validated_data.get("status", instance.status)
        instance.grand_total = (
            instance.subtotal - instance.discount_total + instance.tax_total
        ).quantize(Decimal("0.01"))
        if instance.grand_total < 0:
            raise serializers.ValidationError("Grand total cannot be negative.")
        instance.save()
        return instance


class GoodsReceiptItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    batch_no = serializers.CharField()
    expiry_date = serializers.DateField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    selling_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )

    def validate(self, attrs):
        if attrs["qty"] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        if attrs["unit_cost"] <= 0:
            raise serializers.ValidationError("Unit cost must be greater than zero.")
        selling_price = attrs.get("selling_price")
        if selling_price is not None and selling_price < 0:
            raise serializers.ValidationError("Selling price cannot be negative.")
        return attrs


class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name")
    sku = serializers.CharField(source="product.sku")

    class Meta:
        model = GoodsReceiptItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "sku",
            "batch_no",
            "expiry_date",
            "qty",
            "unit_cost",
            "selling_price",
        ]


class GoodsReceiptSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name")
    warehouse_name = serializers.CharField(source="warehouse.name")
    created_by = serializers.CharField(source="created_by.username")
    items = GoodsReceiptItemSerializer(many=True)
    ref_po_no = serializers.CharField(source="ref_po.po_no", allow_null=True)

    class Meta:
        model = GoodsReceipt
        fields = [
            "id",
            "grn_no",
            "status",
            "supplier_id",
            "supplier_name",
            "warehouse_id",
            "warehouse_name",
            "received_at",
            "created_by",
            "created_at",
            "ref_po",
            "ref_po_no",
            "items",
        ]


class GoodsReceiptUpsertSerializer(serializers.Serializer):
    supplier_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    ref_po_id = serializers.IntegerField(required=False, allow_null=True)
    items = GoodsReceiptItemInputSerializer(many=True)

    def validate(self, attrs):
        request = self.context["request"]
        company = get_user_company(request.user)
        supplier = Supplier.objects.filter(company=company, id=attrs["supplier_id"]).first()
        if not supplier:
            raise serializers.ValidationError("Supplier not found.")
        warehouse = scoped_warehouses(request.user).filter(id=attrs["warehouse_id"]).first()
        if not warehouse:
            raise serializers.ValidationError("Warehouse not in your scope.")
        attrs["supplier"] = supplier
        attrs["warehouse"] = warehouse
        if attrs.get("ref_po_id"):
            po = (
                PurchaseOrder.objects.filter(company=company, id=attrs["ref_po_id"])
                .select_related("warehouse")
                .first()
            )
            if not po:
                raise serializers.ValidationError("Purchase order not found.")
            if po.warehouse_id != warehouse.id:
                raise serializers.ValidationError("Purchase order warehouse mismatch.")
            attrs["ref_po"] = po
        else:
            attrs["ref_po"] = None
        product_ids = [item["product_id"] for item in attrs["items"]]
        products = Product.objects.filter(company=company, id__in=product_ids)
        if products.count() != len(product_ids):
            raise serializers.ValidationError("One or more products are invalid.")
        product_map = {product.id: product for product in products}
        attrs["items"] = [
            {
                "product": product_map[item["product_id"]],
                "batch_no": item["batch_no"],
                "expiry_date": item["expiry_date"],
                "qty": item["qty"],
                "unit_cost": item["unit_cost"],
                "selling_price": item.get("selling_price"),
            }
            for item in attrs["items"]
        ]
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        company = get_user_company(request.user)
        grn = GoodsReceipt.objects.create(
            company=company,
            supplier=validated_data["supplier"],
            warehouse=validated_data["warehouse"],
            grn_no=validated_data["grn_no"],
            status=GoodsReceipt.Status.DRAFT,
            created_by=request.user,
            ref_po=validated_data.get("ref_po"),
        )
        GoodsReceiptItem.objects.bulk_create(
            [
                GoodsReceiptItem(
                    goods_receipt=grn,
                    product=item["product"],
                    batch_no=item["batch_no"],
                    expiry_date=item["expiry_date"],
                    qty=item["qty"],
                    unit_cost=item["unit_cost"],
                    selling_price=item.get("selling_price"),
                )
                for item in validated_data["items"]
            ]
        )
        return grn

    def update(self, instance, validated_data):
        if instance.status != GoodsReceipt.Status.DRAFT:
            raise serializers.ValidationError("Only draft goods receipts can be updated.")
        instance.supplier = validated_data.get("supplier", instance.supplier)
        instance.warehouse = validated_data.get("warehouse", instance.warehouse)
        instance.ref_po = validated_data.get("ref_po", instance.ref_po)
        if "items" in validated_data:
            instance.items.all().delete()
            GoodsReceiptItem.objects.bulk_create(
                [
                    GoodsReceiptItem(
                        goods_receipt=instance,
                        product=item["product"],
                        batch_no=item["batch_no"],
                        expiry_date=item["expiry_date"],
                        qty=item["qty"],
                        unit_cost=item["unit_cost"],
                        selling_price=item.get("selling_price"),
                    )
                    for item in validated_data["items"]
                ]
            )
        instance.save()
        return instance


class SupplierInvoiceSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name")
    warehouse_name = serializers.CharField(source="warehouse.name")
    created_by = serializers.CharField(source="created_by.username")
    ref_grn_no = serializers.CharField(source="ref_grn.grn_no", allow_null=True)

    class Meta:
        model = SupplierInvoice
        fields = [
            "id",
            "supplier_invoice_no",
            "status",
            "supplier_id",
            "supplier_name",
            "warehouse_id",
            "warehouse_name",
            "subtotal",
            "tax_total",
            "grand_total",
            "ref_grn",
            "ref_grn_no",
            "created_by",
            "created_at",
        ]


class SupplierInvoiceCreateSerializer(serializers.Serializer):
    supplier_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    supplier_invoice_no = serializers.CharField()
    subtotal = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    tax_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    ref_grn_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context["request"]
        company = get_user_company(request.user)
        supplier = Supplier.objects.filter(company=company, id=attrs["supplier_id"]).first()
        if not supplier:
            raise serializers.ValidationError("Supplier not found.")
        warehouse = scoped_warehouses(request.user).filter(id=attrs["warehouse_id"]).first()
        if not warehouse:
            raise serializers.ValidationError("Warehouse not in your scope.")
        attrs["supplier"] = supplier
        attrs["warehouse"] = warehouse
        ref_grn = None
        if attrs.get("ref_grn_id"):
            ref_grn = (
                GoodsReceipt.objects.filter(company=company, id=attrs["ref_grn_id"])
                .select_related("supplier", "warehouse")
                .first()
            )
            if not ref_grn:
                raise serializers.ValidationError("GRN not found.")
            if ref_grn.supplier_id != supplier.id:
                raise serializers.ValidationError("GRN supplier mismatch.")
            if ref_grn.warehouse_id != warehouse.id:
                raise serializers.ValidationError("GRN warehouse mismatch.")
        attrs["ref_grn"] = ref_grn
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return create_supplier_invoice(
            company=get_user_company(request.user),
            supplier=validated_data["supplier"],
            warehouse=validated_data["warehouse"],
            supplier_invoice_no=validated_data["supplier_invoice_no"],
            subtotal=validated_data.get("subtotal"),
            tax_total=validated_data.get("tax_total"),
            ref_grn=validated_data.get("ref_grn"),
            user=request.user,
        )

    def update(self, instance, validated_data):
        if instance.status != SupplierInvoice.Status.DRAFT:
            raise serializers.ValidationError("Only draft supplier invoices can be updated.")
        instance.supplier = validated_data.get("supplier", instance.supplier)
        instance.warehouse = validated_data.get("warehouse", instance.warehouse)
        instance.supplier_invoice_no = validated_data.get(
            "supplier_invoice_no", instance.supplier_invoice_no
        )
        instance.subtotal = validated_data.get("subtotal", instance.subtotal)
        instance.tax_total = validated_data.get("tax_total", instance.tax_total)
        instance.ref_grn = validated_data.get("ref_grn", instance.ref_grn)
        instance.grand_total = (instance.subtotal + instance.tax_total).quantize(
            Decimal("0.01")
        )
        if instance.grand_total < 0:
            raise serializers.ValidationError("Grand total cannot be negative.")
        instance.save()
        return instance
