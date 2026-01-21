from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.audit import log_audit_event
from accounts.models import get_user_company
from accounts.permissions import ComplianceLogPermission, ComplianceSendPermission
from inventory.models import StockLedger
from sales.models import SaleInvoice

from .models import RSDTransmissionLog, ZATCAInvoiceLog
from .serializers import RSDMovementSendSerializer, RSDTransmissionLogSerializer, ZATCAInvoiceLogSerializer
from .services import build_rsd_movement_payload, build_zatca_invoice_payload


class ZATCAInvoiceSendView(APIView):
    permission_classes = [ComplianceSendPermission]

    def post(self, request, invoice_id):
        company = get_user_company(request.user)
        force = str(request.query_params.get("force", "")).lower() in {"1", "true", "yes"}
        invoice = (
            SaleInvoice.objects.select_related("branch", "warehouse")
            .prefetch_related("items__product", "payments")
            .filter(company=company, id=invoice_id)
            .first()
        )
        if not invoice:
            raise serializers.ValidationError("Invoice not found.")
        if (
            not force
            and ZATCAInvoiceLog.objects.filter(
                company=company, ref=invoice.invoice_no, status="SENT"
            ).exists()
        ):
            raise serializers.ValidationError("Invoice has already been sent.")
        payload = build_zatca_invoice_payload(invoice)
        log = ZATCAInvoiceLog.objects.create(
            company=company,
            ref=invoice.invoice_no,
            payload=payload,
            status="PENDING",
        )
        log.status = "SENT"
        log.sent_at = timezone.now()
        log.save(update_fields=["status", "sent_at"])
        log_audit_event(
            company=company,
            user=request.user,
            action="SEND",
            entity_type="ZATCAInvoiceLog",
            entity_id=log.id,
            summary=f"Sent ZATCA invoice {invoice.invoice_no}",
        )
        return Response(ZATCAInvoiceLogSerializer(log).data, status=status.HTTP_201_CREATED)


class ZATCALogListView(APIView):
    permission_classes = [ComplianceLogPermission]

    def get(self, request):
        company = get_user_company(request.user)
        logs = ZATCAInvoiceLog.objects.filter(company=company).order_by("-created_at")
        return Response(ZATCAInvoiceLogSerializer(logs, many=True).data)


class ZATCALogDetailView(APIView):
    permission_classes = [ComplianceLogPermission]

    def get(self, request, log_id):
        company = get_user_company(request.user)
        log = ZATCAInvoiceLog.objects.filter(company=company, id=log_id).first()
        if not log:
            raise serializers.ValidationError("Log not found.")
        return Response(ZATCAInvoiceLogSerializer(log).data)


class RSDMovementSendView(APIView):
    permission_classes = [ComplianceSendPermission]

    def post(self, request):
        serializer = RSDMovementSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = get_user_company(request.user)
        force = str(request.query_params.get("force", "")).lower() in {"1", "true", "yes"}
        ledger_rows = StockLedger.objects.filter(company=company)
        ref_type = serializer.validated_data.get("ref_type")
        ref_id = serializer.validated_data.get("ref_id")
        stock_ledger_ids = serializer.validated_data.get("stock_ledger_ids")
        include_non_drug = serializer.validated_data.get("include_non_drug", False)
        if stock_ledger_ids:
            ledger_rows = ledger_rows.filter(id__in=stock_ledger_ids)
            ref_label = f"IDS:{','.join(str(item) for item in stock_ledger_ids)}"
        else:
            ledger_rows = ledger_rows.filter(ref_type=ref_type, ref_id=ref_id)
            ref_label = f"{ref_type}:{ref_id}"
        if (
            not force
            and RSDTransmissionLog.objects.filter(
                company=company, ref=ref_label, status="SENT"
            ).exists()
        ):
            raise serializers.ValidationError("Movement payload has already been sent.")
        ledger_rows = ledger_rows.select_related("product", "batch", "warehouse")
        payload = build_rsd_movement_payload(
            ledger_rows,
            ref_type=ref_type,
            ref_id=ref_id,
            stock_ledger_ids=stock_ledger_ids,
            include_non_drug=include_non_drug,
        )
        log = RSDTransmissionLog.objects.create(
            company=company,
            ref=ref_label,
            payload=payload,
            status="PENDING",
        )
        if not payload["rows"]:
            log.status = "FAILED"
            log.error = "No movement rows found for selection."
            log.save(update_fields=["status", "error"])
            raise serializers.ValidationError(log.error)
        log.status = "SENT"
        log.sent_at = timezone.now()
        log.save(update_fields=["status", "sent_at"])
        log_audit_event(
            company=company,
            user=request.user,
            action="SEND",
            entity_type="RSDTransmissionLog",
            entity_id=log.id,
            summary=f"Sent RSD movement payload {ref_label}",
        )
        return Response(RSDTransmissionLogSerializer(log).data, status=status.HTTP_201_CREATED)


class RSDLogListView(APIView):
    permission_classes = [ComplianceLogPermission]

    def get(self, request):
        company = get_user_company(request.user)
        logs = RSDTransmissionLog.objects.filter(company=company).order_by("-created_at")
        return Response(RSDTransmissionLogSerializer(logs, many=True).data)


class RSDLogDetailView(APIView):
    permission_classes = [ComplianceLogPermission]

    def get(self, request, log_id):
        company = get_user_company(request.user)
        log = RSDTransmissionLog.objects.filter(company=company, id=log_id).first()
        if not log:
            raise serializers.ValidationError("Log not found.")
        return Response(RSDTransmissionLogSerializer(log).data)
