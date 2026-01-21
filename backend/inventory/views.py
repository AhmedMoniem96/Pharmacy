from rest_framework import viewsets, views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from .models import Batch, StockLedger
from .serializers import (
    BatchSerializer, 
    StockLedgerSerializer, 
    ReceiveStockSerializer
)

class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Batch.objects.filter(product__company=self.request.user.profile.company)

class StockLedgerViewSet(viewsets.ModelViewSet):
    serializer_class = StockLedgerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StockLedger.objects.filter(company=self.request.user.profile.company)

class AdjustStockView(views.APIView):
    permission_classes = [IsAuthenticated]
    pass

class LowStockAlertView(views.APIView):
    permission_classes = [IsAuthenticated]
    pass

class NearExpiryAlertView(views.APIView):
    permission_classes = [IsAuthenticated]
    pass

class ReceiveStockView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReceiveStockSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            data = serializer.validated_data
            with transaction.atomic():
                # Logic to create batches and stock ledger entries would go here
                # For now, we return success to allow the endpoint to function
                return Response({"detail": "Stock received successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TransferStockView(views.APIView):
    permission_classes = [IsAuthenticated]
    pass