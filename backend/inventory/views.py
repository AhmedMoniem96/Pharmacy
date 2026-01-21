from rest_framework import viewsets

from accounts.models import get_user_company, scoped_warehouses
from accounts.permissions import BatchPermission

from .models import Batch, StockLedger
from .serializers import BatchSerializer, StockLedgerSerializer


class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    permission_classes = [BatchPermission]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        warehouses = scoped_warehouses(self.request.user)
        if not company:
            return Batch.objects.none()
        return Batch.objects.filter(company=company, warehouse__in=warehouses)

    def perform_create(self, serializer):
        serializer.save(company=get_user_company(self.request.user))


class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLedgerSerializer

    def get_queryset(self):
        company = get_user_company(self.request.user)
        warehouses = scoped_warehouses(self.request.user)
        if not company:
            return StockLedger.objects.none()
        return StockLedger.objects.filter(company=company, warehouse__in=warehouses)
