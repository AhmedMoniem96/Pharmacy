from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Payment, SaleInvoice, SaleItem
from .serializers import (
    PaymentInputSerializer,
    ReturnCreateSerializer,
    SaleCreateSerializer,
    SaleInvoiceReceiptSerializer,
)

class SaleCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            data = serializer.validated_data
            company = request.user.profile.company

            with transaction.atomic():
                # Generate Invoice Number
                last_invoice = SaleInvoice.objects.filter(company=company).aggregate(
                    Max("sequence")
                )["sequence__max"]
                sequence = (last_invoice or 0) + 1
                invoice_no = f"INV-{sequence:06d}"

                invoice = SaleInvoice.objects.create(
                    company=company,
                    branch=data["branch"],
                    warehouse=data["warehouse"],
                    invoice_no=invoice_no,
                    invoice_date=date.today(),
                    sequence=sequence,
                    created_by=request.user,
                    status=SaleInvoice.Status.DRAFT,
                    kind=SaleInvoice.Kind.SALE,
                )

                subtotal = Decimal("0.00")
                
                for item in data["items"]:
                    product = item["product"]
                    qty = item["qty"]
                    # Assuming product has a price field, defaulting to 0 if not found
                    unit_price = getattr(product, "sales_price", Decimal("0.00"))
                    line_total = unit_price * qty
                    
                    SaleItem.objects.create(
                        invoice=invoice,
                        product=product,
                        qty=qty,
                        unit_price=unit_price,
                        line_total=line_total
                    )
                    subtotal += line_total

                invoice.subtotal = subtotal
                invoice.discount_total = data.get("discount_total", Decimal("0.00"))
                invoice.tax_total = data.get("tax_total", Decimal("0.00"))
                invoice.grand_total = (subtotal - invoice.discount_total) + invoice.tax_total
                invoice.save()

                # Process Payments
                payments = data.get("payments")
                if payments:
                    total_paid = Decimal("0.00")
                    for payment_data in payments:
                        Payment.objects.create(
                            invoice=invoice,
                            method=payment_data["method"],
                            amount=payment_data["amount"],
                            reference=payment_data.get("reference"),
                        )
                        total_paid += payment_data["amount"]
                    
                    if total_paid >= invoice.grand_total:
                        invoice.status = SaleInvoice.Status.PAID
                    elif total_paid > 0:
                        invoice.status = SaleInvoice.Status.PARTIAL
                    invoice.save()

            receipt_serializer = SaleInvoiceReceiptSerializer(invoice)
            return Response(receipt_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SalePaymentView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invoice_id):
        invoice = get_object_or_404(SaleInvoice, id=invoice_id, company=request.user.profile.company)
        serializer = PaymentInputSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            with transaction.atomic():
                Payment.objects.create(
                    invoice=invoice,
                    method=data["method"],
                    amount=data["amount"],
                    reference=data.get("reference"),
                )
                
                # Recalculate status
                total_paid = sum(p.amount for p in invoice.payments.all())
                if total_paid >= invoice.grand_total:
                    invoice.status = SaleInvoice.Status.PAID
                elif total_paid > 0:
                    invoice.status = SaleInvoice.Status.PARTIAL
                invoice.save()
                
            return Response({"detail": "Payment added successfully."}, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SaleReturnView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invoice_id):
        original_invoice = get_object_or_404(SaleInvoice, id=invoice_id, company=request.user.profile.company)
        serializer = ReturnCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            company = request.user.profile.company
            
            with transaction.atomic():
                # Generate Return Invoice No
                last_invoice = SaleInvoice.objects.filter(company=company).aggregate(Max("sequence"))["sequence__max"]
                sequence = (last_invoice or 0) + 1
                invoice_no = f"RET-{sequence:06d}"
                
                return_invoice = SaleInvoice.objects.create(
                    company=company,
                    branch=original_invoice.branch,
                    warehouse=original_invoice.warehouse,
                    invoice_no=invoice_no,
                    invoice_date=date.today(),
                    sequence=sequence,
                    created_by=request.user,
                    status=SaleInvoice.Status.RETURNED,
                    kind=SaleInvoice.Kind.RETURN,
                    original_invoice=original_invoice
                )
                
                subtotal = Decimal("0.00")
                
                for item in data["items"]:
                    sale_item = item["sale_item"]
                    qty = item["qty"]
                    
                    unit_price = sale_item.unit_price
                    line_total = unit_price * qty
                    
                    SaleItem.objects.create(
                        invoice=return_invoice,
                        product=sale_item.product,
                        batch=sale_item.batch,
                        qty=qty,
                        unit_price=unit_price,
                        line_total=line_total
                    )
                    subtotal += line_total
                
                return_invoice.subtotal = subtotal
                return_invoice.grand_total = subtotal
                return_invoice.save()
                
            return Response({"detail": "Return processed.", "return_invoice_no": invoice_no}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SaleReceiptView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_id):
        invoice = get_object_or_404(SaleInvoice, id=invoice_id, company=request.user.profile.company)
        serializer = SaleInvoiceReceiptSerializer(invoice)
        return Response(serializer.data)