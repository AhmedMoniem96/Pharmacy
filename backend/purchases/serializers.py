from rest_framework import serializers
from .models import Supplier, PurchaseOrder, GoodsReceipt, SupplierInvoice

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'

class GoodsReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsReceipt
        fields = '__all__'

class SupplierInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierInvoice
        fields = '__all__'