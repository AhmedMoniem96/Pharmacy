from django.db import transaction
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.mixins import CompanyScopedModelViewSet
from accounts.models import get_user_company, scoped_warehouses
from accounts.permissions import PurchasePermission

from .models import GoodsReceipt, PurchaseOrder, Supplier, SupplierInvoice
from .serializers import (
    GoodsReceiptSerializer,
    GoodsReceiptUpsertSerializer,
    PurchaseOrderSerializer,
    PurchaseOrderUpsertSerializer,
    SupplierInvoiceCreateSerializer,
    SupplierInvoiceSerializer,
    SupplierSerializer,
)
from .services import post_goods_receipt, post_supplier_invoice


class SupplierViewSet(CompanyScopedModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [PurchasePermission]

    def get_queryset(self):
        return self.filter_company_queryset(Supplier.objects.all())


class PurchaseOrderViewSet(CompanyScopedModelViewSet):
    permission_classes = [PurchasePermission]
    company_create_field = None

    def get_queryset(self):
        warehouses = scoped_warehouses(self.request.user)
        queryset = PurchaseOrder.objects.filter(warehouse__in=warehouses).select_related(
            "branch", "warehouse", "created_by"
        ).prefetch_related("items__product")
        return self.filter_company_queryset(queryset)

    def get_serializer_class(self):
        if self.action in {"list", "retrieve"}:
            return PurchaseOrderSerializer
        return PurchaseOrderUpsertSerializer

    @action(methods=["post"], detail=True, permission_classes=[PurchasePermission])
    def submit(self, request, pk=None):
        purchase_order = self.get_object()
        if purchase_order.status != PurchaseOrder.Status.DRAFT:
            raise serializers.ValidationError("Only draft purchase orders can be submitted.")
        purchase_order.status = PurchaseOrder.Status.SENT
        purchase_order.save(update_fields=["status"])
        return Response(
            {"id": purchase_order.id, "po_no": purchase_order.po_no, "status": purchase_order.status},
            status=status.HTTP_200_OK,
        )


class GoodsReceiptViewSet(CompanyScopedModelViewSet):
    permission_classes = [PurchasePermission]
    company_create_field = None

    def get_queryset(self):
        warehouses = scoped_warehouses(self.request.user)
        queryset = GoodsReceipt.objects.filter(warehouse__in=warehouses).select_related(
            "supplier", "warehouse", "created_by", "ref_po"
        ).prefetch_related("items__product")
        return self.filter_company_queryset(queryset)

    def get_serializer_class(self):
        if self.action in {"list", "retrieve"}:
            return GoodsReceiptSerializer
        return GoodsReceiptUpsertSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        with transaction.atomic():
            serializer.save(grn_no=self._generate_grn_number(company))
        headers = self.get_success_headers(serializer.data)
        grn = GoodsReceipt.objects.get(id=serializer.instance.id)
        return Response(GoodsReceiptSerializer(grn).data, status=status.HTTP_201_CREATED, headers=headers)

    def _generate_grn_number(self, company):
        from .services import _generate_grn_number

        return _generate_grn_number(company)

    @action(methods=["post"], detail=True, permission_classes=[PurchasePermission])
    def post(self, request, pk=None):
        goods_receipt = self.get_object()
        posted = post_goods_receipt(
            company=get_user_company(request.user),
            goods_receipt=goods_receipt,
            user=request.user,
        )
        return Response(
            {
                "id": posted.id,
                "grn_no": posted.grn_no,
                "status": posted.status,
                "received_at": posted.received_at,
            },
            status=status.HTTP_200_OK,
        )


class SupplierInvoiceViewSet(CompanyScopedModelViewSet):
    permission_classes = [PurchasePermission]
    company_create_field = None

    def get_queryset(self):
        warehouses = scoped_warehouses(self.request.user)
        queryset = SupplierInvoice.objects.filter(warehouse__in=warehouses).select_related(
            "supplier", "warehouse", "created_by", "ref_grn"
        )
        return self.filter_company_queryset(queryset)

    def get_serializer_class(self):
        if self.action in {"list", "retrieve"}:
            return SupplierInvoiceSerializer
        return SupplierInvoiceCreateSerializer

    @action(methods=["post"], detail=True, permission_classes=[PurchasePermission])
    def post(self, request, pk=None):
        invoice = self.get_object()
        posted = post_supplier_invoice(
            company=get_user_company(request.user),
            invoice=invoice,
            user=request.user,
        )
        return Response(
            {
                "id": posted.id,
                "supplier_invoice_no": posted.supplier_invoice_no,
                "status": posted.status,
            },
            status=status.HTTP_200_OK,
        )
