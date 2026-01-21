from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Supplier, PurchaseOrder, GoodsReceipt, SupplierInvoice
from .serializers import SupplierSerializer, PurchaseOrderSerializer, GoodsReceiptSerializer, SupplierInvoiceSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

class GoodsReceiptViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceipt.objects.all()
    serializer_class = GoodsReceiptSerializer
    permission_classes = [IsAuthenticated]

class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.all()
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [IsAuthenticated]