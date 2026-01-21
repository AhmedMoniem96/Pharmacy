from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import get_user_company, scoped_warehouses
from accounts.permissions import SalePermission, SaleReturnPermission

from .models import SaleInvoice
from .serializers import (
    PaymentCreateSerializer,
    SaleCreateSerializer,
    SaleInvoiceReceiptSerializer,
    ReturnCreateSerializer,
)
from .services import add_payment, create_sale_invoice, return_sale_invoice


class SaleCreateView(APIView):
    permission_classes = [SalePermission]

    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        warehouse = serializer.validated_data["warehouse"]
        if warehouse not in scoped_warehouses(request.user):
            raise serializers.ValidationError("Warehouse not in your scope.")
        invoice = create_sale_invoice(
            company=company,
            branch=serializer.validated_data["branch"],
            warehouse=warehouse,
            items=serializer.validated_data["items"],
            discount_total=serializer.validated_data.get("discount_total"),
            tax_total=serializer.validated_data.get("tax_total"),
            payments=serializer.validated_data.get("payments") or [],
            user=request.user,
        )
        return Response(
            SaleInvoiceReceiptSerializer(invoice).data,
            status=status.HTTP_201_CREATED,
        )


class SalePaymentView(APIView):
    permission_classes = [SalePermission]

    def post(self, request, invoice_id):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        invoice = (
            SaleInvoice.objects.select_related("warehouse", "branch")
            .filter(company=company, id=invoice_id)
            .first()
        )
        if not invoice:
            raise serializers.ValidationError("Invoice not found.")
        if invoice.warehouse not in scoped_warehouses(request.user):
            raise serializers.ValidationError("Warehouse not in your scope.")
        invoice = add_payment(
            company=company,
            invoice=invoice,
            payments=serializer.validated_data["payments"],
            user=request.user,
        )
        return Response(SaleInvoiceReceiptSerializer(invoice).data, status=status.HTTP_200_OK)


class SaleReturnView(APIView):
    permission_classes = [SaleReturnPermission]

    def post(self, request, invoice_id):
        serializer = ReturnCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        invoice = (
            SaleInvoice.objects.select_related("warehouse", "branch")
            .filter(company=company, id=invoice_id)
            .first()
        )
        if not invoice:
            raise serializers.ValidationError("Invoice not found.")
        if invoice.warehouse not in scoped_warehouses(request.user):
            raise serializers.ValidationError("Warehouse not in your scope.")
        return_invoice = return_sale_invoice(
            company=company,
            invoice=invoice,
            items=serializer.validated_data["items"],
            user=request.user,
        )
        return Response(
            SaleInvoiceReceiptSerializer(return_invoice).data,
            status=status.HTTP_201_CREATED,
        )


class SaleReceiptView(APIView):
    permission_classes = [SalePermission]

    def get(self, request, invoice_id):
        company = get_user_company(request.user)
        invoice = (
            SaleInvoice.objects.select_related("branch", "warehouse", "created_by")
            .prefetch_related("items__product", "items__batch", "payments")
            .filter(company=company, id=invoice_id)
            .first()
        )
        if not invoice:
            raise serializers.ValidationError("Invoice not found.")
        if invoice.warehouse not in scoped_warehouses(request.user):
            raise serializers.ValidationError("Warehouse not in your scope.")
        return Response(SaleInvoiceReceiptSerializer(invoice).data, status=status.HTTP_200_OK)
