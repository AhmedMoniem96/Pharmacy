from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status, viewsets, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sales.models import SaleInvoice, SaleItem
from .models import ReportSavedView, ReportSchedule


def _coerce_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _build_filter_payload(data):
    return {
        "start_date": data.get("start_date") or data.get("date_start"),
        "end_date": data.get("end_date") or data.get("date_end"),
        "warehouse": data.get("warehouse") or data.get("warehouse_id"),
        "category": data.get("category") or data.get("category_id"),
        "owner": data.get("owner") or data.get("owner_id"),
    }


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        data = request.data if request.method == "POST" else request.query_params
        filters = _build_filter_payload(data)
        company = request.user.profile.company

        start_date = parse_date(filters.get("start_date") or "")
        end_date = parse_date(filters.get("end_date") or "")
        if filters.get("start_date") and not start_date:
            return Response({"detail": "Invalid start_date."}, status=status.HTTP_400_BAD_REQUEST)
        if filters.get("end_date") and not end_date:
            return Response({"detail": "Invalid end_date."}, status=status.HTTP_400_BAD_REQUEST)
        if start_date and end_date and start_date > end_date:
            return Response(
                {"detail": "start_date cannot be after end_date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoices = SaleInvoice.objects.filter(
            company=company, kind=SaleInvoice.Kind.SALE
        ).select_related("warehouse", "created_by")

        if start_date:
            invoices = invoices.filter(invoice_date__gte=start_date)
        if end_date:
            invoices = invoices.filter(invoice_date__lte=end_date)

        warehouse_id = _coerce_int(filters.get("warehouse"))
        if warehouse_id:
            invoices = invoices.filter(warehouse_id=warehouse_id)

        owner_id = _coerce_int(filters.get("owner"))
        if owner_id:
            invoices = invoices.filter(created_by_id=owner_id)

        category_id = _coerce_int(filters.get("category"))
        if category_id:
            invoices = invoices.filter(items__product__category_id=category_id).distinct()

        total_revenue = invoices.aggregate(
            total=Coalesce(Sum("grand_total"), Decimal("0.00"))
        )["total"]
        invoice_count = invoices.count()
        line_item_count = SaleItem.objects.filter(invoice__in=invoices).count()

        reports = [
            {
                "id": invoice.id,
                "invoice_no": invoice.invoice_no,
                "invoice_date": invoice.invoice_date,
                "warehouse": {
                    "id": invoice.warehouse_id,
                    "name": invoice.warehouse.name if invoice.warehouse else None,
                },
                "owner": {
                    "id": invoice.created_by_id,
                    "name": invoice.created_by.get_full_name() or invoice.created_by.username,
                },
                "grand_total": invoice.grand_total,
            }
            for invoice in invoices.order_by("-invoice_date", "-id")[:100]
        ]

        return Response(
            {
                "filters": filters,
                "summary": {
                    "invoice_count": invoice_count,
                    "total_revenue": total_revenue,
                    "line_item_count": line_item_count,
                },
                "reports": reports,
                "generated_at": timezone.now(),
            }
        )


class ReportSavedViewListCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.profile.company
        saved_views = ReportSavedView.objects.filter(company=company).order_by("-created_at")
        data = [
            {
                "id": saved_view.id,
                "name": saved_view.name,
                "filters": saved_view.filters,
                "created_at": saved_view.created_at,
            }
            for saved_view in saved_views
        ]
        return Response(data)

    def post(self, request):
        company = request.user.profile.company
        payload = request.data or {}
        filters = payload.get("filters") or _build_filter_payload(payload)
        name = payload.get("name") or "Saved view"
        saved_view = ReportSavedView.objects.create(
            company=company,
            name=name,
            filters=filters,
            created_by=request.user,
        )
        return Response(
            {
                "id": saved_view.id,
                "name": saved_view.name,
                "filters": saved_view.filters,
                "created_at": saved_view.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class ReportScheduleListCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.profile.company
        schedules = ReportSchedule.objects.filter(company=company).order_by("-created_at")
        data = [
            {
                "id": schedule.id,
                "name": schedule.name,
                "filters": schedule.filters,
                "cadence": schedule.cadence,
                "recipients": schedule.recipients,
                "next_run_at": schedule.next_run_at,
                "created_at": schedule.created_at,
            }
            for schedule in schedules
        ]
        return Response(data)

    def post(self, request):
        company = request.user.profile.company
        payload = request.data or {}
        filters = payload.get("filters") or _build_filter_payload(payload)
        name = payload.get("name") or "Scheduled report"
        cadence = payload.get("cadence") or "weekly"
        recipients = payload.get("recipients") or []
        next_run_raw = payload.get("next_run_at")
        next_run_at = parse_datetime(next_run_raw) if next_run_raw else None
        schedule = ReportSchedule.objects.create(
            company=company,
            name=name,
            filters=filters,
            cadence=cadence,
            recipients=recipients,
            next_run_at=next_run_at,
            created_by=request.user,
        )
        return Response(
            {
                "id": schedule.id,
                "name": schedule.name,
                "filters": schedule.filters,
                "cadence": schedule.cadence,
                "recipients": schedule.recipients,
                "next_run_at": schedule.next_run_at,
                "created_at": schedule.created_at,
            },
            status=status.HTTP_201_CREATED,
        )
