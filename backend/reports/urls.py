from django.urls import path

from .views import (
    FinancePnLReportView,
    FinanceVATReportView,
    InventoryStockOnHandReportView,
    InventoryStockValuationReportView,
    SalesByBranchReportView,
    SalesPaymentMethodsReportView,
    SalesSummaryReportView,
    SalesTopProductsReportView,
)

urlpatterns = [
    path("reports/sales/summary/", SalesSummaryReportView.as_view(), name="reports-sales-summary"),
    path(
        "reports/sales/top-products/",
        SalesTopProductsReportView.as_view(),
        name="reports-sales-top-products",
    ),
    path(
        "reports/sales/by-branch/",
        SalesByBranchReportView.as_view(),
        name="reports-sales-by-branch",
    ),
    path(
        "reports/payments/methods/",
        SalesPaymentMethodsReportView.as_view(),
        name="reports-payments-methods",
    ),
    path(
        "reports/inventory/stock-on-hand/",
        InventoryStockOnHandReportView.as_view(),
        name="reports-inventory-stock-on-hand",
    ),
    path(
        "reports/inventory/stock-valuation/",
        InventoryStockValuationReportView.as_view(),
        name="reports-inventory-stock-valuation",
    ),
    path("reports/finance/pnl/", FinancePnLReportView.as_view(), name="reports-finance-pnl"),
    path("reports/finance/vat/", FinanceVATReportView.as_view(), name="reports-finance-vat"),
]
