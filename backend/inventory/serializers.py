from rest_framework import serializers
from .models import Batch, StockLedger

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

class StockLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLedger
        fields = '__all__'

class ReceiveStockSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2)
    batch_no = serializers.CharField(max_length=100)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    purchase_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    selling_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    
    # This serializer is used for input validation in the view
    # The actual creation logic is handled in the view's post method