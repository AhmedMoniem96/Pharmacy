from datetime import timedelta

from django.db.models import F, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, views, viewsets
from rest_framework.response import Response

from accounts.models import get_user_company
from accounts.permissions import BatchPermission
from masterdata.models import Warehouse

from .models import Batch, StockLedger
from .serializers import (
    AdjustStockSerializer,
    BatchSerializer,
    ReceiveStockSerializer,
    StockLedgerSerializer,
    TransferStockSerializer,
)
from .services import adjust_stock, receive_stock, transfer_stock

class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    permission_classes = [BatchPermission]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return Batch.objects.none()
        return Batch.objects.filter(company=company)

class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLedgerSerializer
    permission_classes = [BatchPermission]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return StockLedger.objects.none()
        return StockLedger.objects.filter(company=company)

class AdjustStockView(views.APIView):
    permission_classes = [BatchPermission]

    def post(self, request):
        serializer = AdjustStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        batches = adjust_stock(
            company=company,
            warehouse=serializer.validated_data["warehouse"],
            items=serializer.validated_data["items"],
            reason=serializer.validated_data["reason"],
            user=request.user,
        )
        return Response(BatchSerializer(batches, many=True).data, status=status.HTTP_201_CREATED)

class LowStockAlertView(views.APIView):
    permission_classes = [BatchPermission]

    def get(self, request):
        warehouse_id = request.query_params.get("warehouse")
        if not warehouse_id:
            return Response(
                {"detail": "warehouse query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        company = get_user_company(request.user)
        warehouse = get_object_or_404(
            Warehouse, id=warehouse_id, branch__company=company
        )
        rows = (
            Batch.objects.filter(company=company, warehouse=warehouse)
            .values(
                "product_id",
                "product__name",
                "product__sku",
                "product__reorder_level",
            )
            .annotate(total_qty=Sum("qty_on_hand"))
            .filter(total_qty__lt=F("product__reorder_level"))
            .order_by("product__name")
        )
        payload = [
            {
                "product_id": row["product_id"],
                "product_name": row["product__name"],
                "product_sku": row["product__sku"],
                "qty_on_hand": row["total_qty"],
                "reorder_level": row["product__reorder_level"],
            }
            for row in rows
        ]
        return Response(payload, status=status.HTTP_200_OK)

class NearExpiryAlertView(views.APIView):
    permission_classes = [BatchPermission]

    def get(self, request):
        warehouse_id = request.query_params.get("warehouse")
        if not warehouse_id:
            return Response(
                {"detail": "warehouse query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        days = int(request.query_params.get("days", 30))
        company = get_user_company(request.user)
        warehouse = get_object_or_404(
            Warehouse, id=warehouse_id, branch__company=company
        )
        today = timezone.now().date()
        end_date = today + timedelta(days=days)
        batches = (
            Batch.objects.filter(
                company=company,
                warehouse=warehouse,
                expiry_date__gte=today,
                expiry_date__lte=end_date,
            )
            .select_related("product")
            .order_by("expiry_date")
        )
        payload = [
            {
                "batch_id": batch.id,
                "batch_no": batch.batch_no,
                "product_id": batch.product_id,
                "product_name": batch.product.name,
                "expiry_date": batch.expiry_date,
                "qty_on_hand": batch.qty_on_hand,
            }
            for batch in batches
        ]
        return Response(payload, status=status.HTTP_200_OK)

class ReceiveStockView(views.APIView):
    permission_classes = [BatchPermission]

    def post(self, request):
        serializer = ReceiveStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        batches = receive_stock(
            company=company,
            warehouse=serializer.validated_data["warehouse"],
            items=serializer.validated_data["items"],
            ref_type=serializer.validated_data["ref_type"],
            ref_id=serializer.validated_data["ref_id"],
            note=serializer.validated_data.get("note") or "",
            user=request.user,
        )
        return Response(BatchSerializer(batches, many=True).data, status=status.HTTP_201_CREATED)

class TransferStockView(views.APIView):
    permission_classes = [BatchPermission]

    def post(self, request):
        serializer = TransferStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        batches = transfer_stock(
            company=company,
            from_warehouse=serializer.validated_data["from_warehouse"],
            to_warehouse=serializer.validated_data["to_warehouse"],
            items=serializer.validated_data["items"],
            ref_type=serializer.validated_data["ref_type"],
            ref_id=serializer.validated_data["ref_id"],
            note=serializer.validated_data.get("note") or "",
            user=request.user,
        )
        return Response(BatchSerializer(batches, many=True).data, status=status.HTTP_201_CREATED)
