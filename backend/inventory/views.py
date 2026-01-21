from datetime import timedelta
from decimal import Decimal

from django.db.models import F, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import get_user_company, scoped_warehouses
from accounts.permissions import BatchPermission

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


class ReceiveStockView(APIView):
    permission_classes = [BatchPermission]

    def post(self, request):
        serializer = ReceiveStockSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        warehouse = serializer.validated_data["warehouse"]
        if warehouse not in scoped_warehouses(request.user):
            raise serializers.ValidationError("Warehouse not in your scope.")
        batches = receive_stock(
            company=company,
            warehouse=warehouse,
            items=serializer.validated_data["items"],
            ref_type=serializer.validated_data["ref_type"],
            ref_id=serializer.validated_data["ref_id"],
            user=request.user,
            note=serializer.validated_data.get("note"),
        )
        return Response(
            BatchSerializer(batches, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class TransferStockView(APIView):
    permission_classes = [BatchPermission]

    def post(self, request):
        serializer = TransferStockSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        from_warehouse = serializer.validated_data["from_warehouse"]
        to_warehouse = serializer.validated_data["to_warehouse"]
        scoped = scoped_warehouses(request.user)
        if from_warehouse not in scoped or to_warehouse not in scoped:
            raise serializers.ValidationError("Warehouse not in your scope.")
        batches = transfer_stock(
            company=company,
            from_warehouse=from_warehouse,
            to_warehouse=to_warehouse,
            items=serializer.validated_data["items"],
            ref_type=serializer.validated_data["ref_type"],
            ref_id=serializer.validated_data["ref_id"],
            user=request.user,
            note=serializer.validated_data.get("note"),
        )
        return Response(BatchSerializer(batches, many=True).data, status=status.HTTP_200_OK)


class AdjustStockView(APIView):
    permission_classes = [BatchPermission]

    def post(self, request):
        serializer = AdjustStockSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        warehouse = serializer.validated_data["warehouse"]
        if warehouse not in scoped_warehouses(request.user):
            raise serializers.ValidationError("Warehouse not in your scope.")
        batches = adjust_stock(
            company=company,
            warehouse=warehouse,
            items=serializer.validated_data["items"],
            reason=serializer.validated_data["reason"],
            user=request.user,
        )
        return Response(BatchSerializer(batches, many=True).data, status=status.HTTP_200_OK)


class LowStockAlertView(APIView):
    permission_classes = [BatchPermission]

    def get(self, request):
        company = get_user_company(request.user)
        if not company:
            return Response([], status=status.HTTP_200_OK)
        warehouse_id = request.query_params.get("warehouse")
        if not warehouse_id:
            raise serializers.ValidationError("Warehouse is required.")
        warehouses = scoped_warehouses(request.user)
        warehouse = warehouses.filter(id=warehouse_id).first()
        if not warehouse:
            raise serializers.ValidationError("Warehouse not in your scope.")
        products = (
            company.products.annotate(
                total_qty=Coalesce(
                    Sum(
                        "batches__qty_on_hand",
                        filter=Q(batches__warehouse=warehouse),
                    ),
                    Decimal("0"),
                )
            )
            .filter(total_qty__lte=F("reorder_level"))
            .order_by("name")
        )
        data = [
            {
                "product_id": product.id,
                "product_name": product.name,
                "sku": product.sku,
                "reorder_level": product.reorder_level,
                "total_qty": product.total_qty,
                "warehouse_id": warehouse.id,
            }
            for product in products
        ]
        return Response(data, status=status.HTTP_200_OK)


class NearExpiryAlertView(APIView):
    permission_classes = [BatchPermission]

    def get(self, request):
        company = get_user_company(request.user)
        if not company:
            return Response([], status=status.HTTP_200_OK)
        warehouse_id = request.query_params.get("warehouse")
        if not warehouse_id:
            raise serializers.ValidationError("Warehouse is required.")
        warehouses = scoped_warehouses(request.user)
        warehouse = warehouses.filter(id=warehouse_id).first()
        if not warehouse:
            raise serializers.ValidationError("Warehouse not in your scope.")
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            raise serializers.ValidationError("Days must be an integer.")
        if days <= 0:
            raise serializers.ValidationError("Days must be greater than zero.")
        today = timezone.now().date()
        cutoff = today + timedelta(days=days)
        batches = (
            Batch.objects.filter(
                company=company,
                warehouse=warehouse,
                qty_on_hand__gt=0,
                expiry_date__lte=cutoff,
            )
            .select_related("product")
            .order_by("expiry_date", "id")
        )
        data = [
            {
                "batch_id": batch.id,
                "batch_no": batch.batch_no,
                "product_id": batch.product_id,
                "product_name": batch.product.name,
                "sku": batch.product.sku,
                "expiry_date": batch.expiry_date,
                "qty_on_hand": batch.qty_on_hand,
                "expires_in_days": (batch.expiry_date - today).days,
                "is_expired": batch.expiry_date < today,
                "is_near_expiry": batch.expiry_date <= cutoff,
                "warehouse_id": warehouse.id,
            }
            for batch in batches
        ]
        return Response(data, status=status.HTTP_200_OK)
