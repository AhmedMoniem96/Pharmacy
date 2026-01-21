from datetime import date
from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum, Value
from django.db.models.functions import Coalesce, TruncDay, TruncMonth
from django.utils.dateparse import parse_date
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import get_user_company, scoped_warehouses
from accounts.permissions import ReportsPermission
from accounting.models import Account, JournalLine, VATConfig
from accounting.services import (
    ACCOUNT_INPUT_VAT,
    ACCOUNT_OUTPUT_VAT,
    ACCOUNT_PURCHASES_EXPENSE,
    ACCOUNT_SALES_REVENUE,
)
from inventory.models import Batch
from sales.models import Payment, SaleInvoice, SaleItem


DECIMAL_ZERO = Decimal("0.00")


def _decimal_str(value):
    if value is None:
        return "0.00"
    if isinstance(value, Decimal):
        return str(value.quantize(Decimal("0.01")))
    return str(value)


def _parse_date_range(query_params) -> tuple[date, date]:
    from_str = query_params.get("from")
    to_str = query_params.get("to")
    if not from_str or not to_str:
        raise ValidationError("Both 'from' and 'to' query parameters are required.")
    from_date = parse_date(from_str)
    to_date = parse_date(to_str)
    if not from_date or not to_date:
        raise ValidationError("Invalid date format. Use YYYY-MM-DD.")
    if from_date > to_date:
        raise ValidationError("'from' date cannot be later than 'to' date.")
    return from_date, to_date


def _get_company(request):
    company = get_user_company(request.user)
    if not company:
        raise ValidationError("User is not associated with a company.")
    return company


def _get_sales_queryset(company, from_date, to_date):
    return SaleInvoice.objects.filter(
        company=company,
        kind=SaleInvoice.Kind.SALE,
        status__in=[SaleInvoice.Status.PAID, SaleInvoice.Status.PARTIAL],
        invoice_date__range=(from_date, to_date),
    )


def _get_account_or_error(company, code, label):
    account = Account.objects.filter(company=company, code=code, is_active=True).first()
    if not account:
        raise ValidationError(f"{label} account is not configured.")
    return account


class SalesSummaryReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        from_date, to_date = _parse_date_range(request.query_params)
        group_by = request.query_params.get("group_by", "day")
        if group_by not in {"day", "month"}:
            raise ValidationError("group_by must be 'day' or 'month'.")
        trunc = TruncDay("invoice_date") if group_by == "day" else TruncMonth("invoice_date")
        rows = (
            _get_sales_queryset(company, from_date, to_date)
            .annotate(period=trunc)
            .values("period")
            .annotate(
                subtotal=Coalesce(Sum("subtotal"), Value(DECIMAL_ZERO)),
                discount_total=Coalesce(Sum("discount_total"), Value(DECIMAL_ZERO)),
                tax_total=Coalesce(Sum("tax_total"), Value(DECIMAL_ZERO)),
                grand_total=Coalesce(Sum("grand_total"), Value(DECIMAL_ZERO)),
                invoice_count=Count("id"),
            )
            .order_by("period")
        )
        data = [
            {
                "period": row["period"].isoformat() if row["period"] else None,
                "invoice_count": int(row["invoice_count"] or 0),
                "subtotal": _decimal_str(row["subtotal"]),
                "discount_total": _decimal_str(row["discount_total"]),
                "tax_total": _decimal_str(row["tax_total"]),
                "grand_total": _decimal_str(row["grand_total"]),
            }
            for row in rows
        ]
        return Response({"from": from_date.isoformat(), "to": to_date.isoformat(), "data": data})


class SalesTopProductsReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        from_date, to_date = _parse_date_range(request.query_params)
        limit = request.query_params.get("limit", 20)
        try:
            limit = int(limit)
        except (TypeError, ValueError):
            raise ValidationError("limit must be an integer.")
        if limit <= 0:
            raise ValidationError("limit must be greater than zero.")
        rows = (
            SaleItem.objects.filter(
                invoice__company=company,
                invoice__kind=SaleInvoice.Kind.SALE,
                invoice__status__in=[SaleInvoice.Status.PAID, SaleInvoice.Status.PARTIAL],
                invoice__invoice_date__range=(from_date, to_date),
            )
            .values("product_id", "product__name", "product__sku")
            .annotate(
                total_qty=Coalesce(Sum("qty"), Value(DECIMAL_ZERO)),
                total_sales=Coalesce(Sum("line_total"), Value(DECIMAL_ZERO)),
            )
            .order_by("-total_sales", "product__name")
        )
        data = [
            {
                "product_id": row["product_id"],
                "product_name": row["product__name"],
                "sku": row["product__sku"],
                "total_qty": _decimal_str(row["total_qty"]),
                "total_sales": _decimal_str(row["total_sales"]),
            }
            for row in rows[:limit]
        ]
        return Response({"from": from_date.isoformat(), "to": to_date.isoformat(), "data": data})


class SalesByBranchReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        from_date, to_date = _parse_date_range(request.query_params)
        rows = (
            _get_sales_queryset(company, from_date, to_date)
            .values("branch_id", "branch__name")
            .annotate(
                subtotal=Coalesce(Sum("subtotal"), Value(DECIMAL_ZERO)),
                discount_total=Coalesce(Sum("discount_total"), Value(DECIMAL_ZERO)),
                tax_total=Coalesce(Sum("tax_total"), Value(DECIMAL_ZERO)),
                grand_total=Coalesce(Sum("grand_total"), Value(DECIMAL_ZERO)),
                invoice_count=Count("id"),
            )
            .order_by("branch__name")
        )
        data = [
            {
                "branch_id": row["branch_id"],
                "branch_name": row["branch__name"],
                "invoice_count": int(row["invoice_count"] or 0),
                "subtotal": _decimal_str(row["subtotal"]),
                "discount_total": _decimal_str(row["discount_total"]),
                "tax_total": _decimal_str(row["tax_total"]),
                "grand_total": _decimal_str(row["grand_total"]),
            }
            for row in rows
        ]
        return Response({"from": from_date.isoformat(), "to": to_date.isoformat(), "data": data})


class SalesPaymentMethodsReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        from_date, to_date = _parse_date_range(request.query_params)
        rows = (
            Payment.objects.filter(
                invoice__company=company,
                invoice__kind=SaleInvoice.Kind.SALE,
                invoice__status__in=[SaleInvoice.Status.PAID, SaleInvoice.Status.PARTIAL],
                invoice__invoice_date__range=(from_date, to_date),
            )
            .values("method")
            .annotate(
                total_amount=Coalesce(Sum("amount"), Value(DECIMAL_ZERO)),
                payment_count=Count("id"),
            )
            .order_by("method")
        )
        data = [
            {
                "method": row["method"],
                "payment_count": int(row["payment_count"] or 0),
                "total_amount": _decimal_str(row["total_amount"]),
            }
            for row in rows
        ]
        return Response({"from": from_date.isoformat(), "to": to_date.isoformat(), "data": data})


class InventoryStockOnHandReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        warehouse_id = request.query_params.get("warehouse_id")
        if not warehouse_id:
            raise ValidationError("warehouse_id query parameter is required.")
        try:
            warehouse_id = int(warehouse_id)
        except (TypeError, ValueError):
            raise ValidationError("warehouse_id must be an integer.")
        warehouse = scoped_warehouses(request.user).filter(id=warehouse_id).first()
        if not warehouse:
            raise NotFound("Warehouse not found in your scope.")
        rows = (
            Batch.objects.filter(company=company, warehouse=warehouse)
            .values("product_id", "product__name", "product__sku")
            .annotate(qty_on_hand=Coalesce(Sum("qty_on_hand"), Value(DECIMAL_ZERO)))
            .filter(qty_on_hand__gt=0)
            .order_by("product__name")
        )
        data = [
            {
                "product_id": row["product_id"],
                "product_name": row["product__name"],
                "sku": row["product__sku"],
                "qty_on_hand": _decimal_str(row["qty_on_hand"]),
            }
            for row in rows
        ]
        return Response(
            {
                "warehouse_id": warehouse.id,
                "warehouse_name": warehouse.name,
                "data": data,
            }
        )


class InventoryStockValuationReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        warehouse_id = request.query_params.get("warehouse_id")
        if not warehouse_id:
            raise ValidationError("warehouse_id query parameter is required.")
        try:
            warehouse_id = int(warehouse_id)
        except (TypeError, ValueError):
            raise ValidationError("warehouse_id must be an integer.")
        warehouse = scoped_warehouses(request.user).filter(id=warehouse_id).first()
        if not warehouse:
            raise NotFound("Warehouse not found in your scope.")
        value_expr = ExpressionWrapper(
            F("qty_on_hand") * F("purchase_price"), output_field=DecimalField(max_digits=16, decimal_places=2)
        )
        rows = (
            Batch.objects.filter(company=company, warehouse=warehouse)
            .values("product_id", "product__name", "product__sku")
            .annotate(
                qty_on_hand=Coalesce(Sum("qty_on_hand"), Value(DECIMAL_ZERO)),
                stock_value=Coalesce(Sum(value_expr), Value(DECIMAL_ZERO)),
            )
            .filter(qty_on_hand__gt=0)
            .order_by("product__name")
        )
        total_value = Decimal("0.00")
        data = []
        for row in rows:
            stock_value = row["stock_value"] or DECIMAL_ZERO
            total_value += stock_value
            data.append(
                {
                    "product_id": row["product_id"],
                    "product_name": row["product__name"],
                    "sku": row["product__sku"],
                    "qty_on_hand": _decimal_str(row["qty_on_hand"]),
                    "stock_value": _decimal_str(stock_value),
                }
            )
        return Response(
            {
                "warehouse_id": warehouse.id,
                "warehouse_name": warehouse.name,
                "total_value": _decimal_str(total_value),
                "data": data,
            }
        )


class FinancePnLReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        from_date, to_date = _parse_date_range(request.query_params)
        revenue_account = _get_account_or_error(company, ACCOUNT_SALES_REVENUE, "Sales revenue")
        purchases_account = _get_account_or_error(
            company, ACCOUNT_PURCHASES_EXPENSE, "Purchases expense"
        )
        lines = JournalLine.objects.filter(
            entry__company=company,
            entry__posted=True,
            entry__date__range=(from_date, to_date),
        )
        revenue = lines.filter(account=revenue_account).aggregate(
            total=Coalesce(
                Sum(ExpressionWrapper(F("credit") - F("debit"), output_field=DecimalField(max_digits=16, decimal_places=2))),
                Value(DECIMAL_ZERO),
            )
        )["total"]
        purchases = lines.filter(account=purchases_account).aggregate(
            total=Coalesce(
                Sum(ExpressionWrapper(F("debit") - F("credit"), output_field=DecimalField(max_digits=16, decimal_places=2))),
                Value(DECIMAL_ZERO),
            )
        )["total"]
        gross_profit = (revenue or DECIMAL_ZERO) - (purchases or DECIMAL_ZERO)
        return Response(
            {
                "from": from_date.isoformat(),
                "to": to_date.isoformat(),
                "revenue": _decimal_str(revenue),
                "purchases": _decimal_str(purchases),
                "gross_profit": _decimal_str(gross_profit),
            }
        )


class FinanceVATReportView(APIView):
    permission_classes = [IsAuthenticated, ReportsPermission]

    def get(self, request):
        company = _get_company(request)
        from_date, to_date = _parse_date_range(request.query_params)
        vat_config = VATConfig.objects.filter(company=company).first()
        if vat_config:
            output_account = vat_config.output_vat_account
            input_account = vat_config.input_vat_account
        else:
            output_account = _get_account_or_error(company, ACCOUNT_OUTPUT_VAT, "Output VAT")
            input_account = _get_account_or_error(company, ACCOUNT_INPUT_VAT, "Input VAT")
        lines = JournalLine.objects.filter(
            entry__company=company,
            entry__posted=True,
            entry__date__range=(from_date, to_date),
        )
        output_total = lines.filter(account=output_account).aggregate(
            total=Coalesce(
                Sum(ExpressionWrapper(F("credit") - F("debit"), output_field=DecimalField(max_digits=16, decimal_places=2))),
                Value(DECIMAL_ZERO),
            )
        )["total"]
        input_total = lines.filter(account=input_account).aggregate(
            total=Coalesce(
                Sum(ExpressionWrapper(F("debit") - F("credit"), output_field=DecimalField(max_digits=16, decimal_places=2))),
                Value(DECIMAL_ZERO),
            )
        )["total"]
        net_vat = (output_total or DECIMAL_ZERO) - (input_total or DECIMAL_ZERO)
        return Response(
            {
                "from": from_date.isoformat(),
                "to": to_date.isoformat(),
                "output_vat": _decimal_str(output_total),
                "input_vat": _decimal_str(input_total),
                "net_vat": _decimal_str(net_vat),
            }
        )
