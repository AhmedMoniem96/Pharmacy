from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import MeView, TokenObtainPairRateLimitedView
from accounting.views import AccountViewSet, JournalEntryViewSet, JournalViewSet
from inventory.views import (
    AdjustStockView,
    BatchViewSet,
    LowStockAlertView,
    NearExpiryAlertView,
    ReceiveStockView,
    StockLedgerViewSet,
    TransferStockView,
)
from masterdata.views import (
    BranchViewSet,
    CategoryViewSet,
    CompanyViewSet,
    ManufacturerViewSet,
    ProductViewSet,
    WarehouseViewSet,
)
from purchases.views import (
    GoodsReceiptViewSet,
    PurchaseOrderViewSet,
    SupplierInvoiceViewSet,
    SupplierViewSet,
)
from sales.views import SaleCreateView, SalePaymentView, SaleReceiptView, SaleReturnView


def health_check(request):
    return JsonResponse({"status": "ok"})


router = DefaultRouter()
router.register(r"masterdata/companies", CompanyViewSet, basename="company")
router.register(r"masterdata/branches", BranchViewSet, basename="branch")
router.register(r"masterdata/warehouses", WarehouseViewSet, basename="warehouse")
router.register(r"masterdata/categories", CategoryViewSet, basename="category")
router.register(r"masterdata/manufacturers", ManufacturerViewSet, basename="manufacturer")
router.register(r"masterdata/products", ProductViewSet, basename="product")

router.register(r"inventory/batches", BatchViewSet, basename="batch")
router.register(r"inventory/stock-ledger", StockLedgerViewSet, basename="stock-ledger")

router.register(r"accounting/accounts", AccountViewSet, basename="accounting-account")
router.register(r"accounting/journals", JournalViewSet, basename="accounting-journal")
router.register(r"accounting/entries", JournalEntryViewSet, basename="accounting-entry")

router.register(r"purchases/suppliers", SupplierViewSet, basename="supplier")
router.register(r"purchases/purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register(r"purchases/goods-receipts", GoodsReceiptViewSet, basename="goods-receipt")
router.register(r"purchases/supplier-invoices", SupplierInvoiceViewSet, basename="supplier-invoice")


urlpatterns = [
    path("admin/", admin.site.urls),

    # Health
    path("api/health/", health_check, name="health-check"),

    # Auth (JWT)
    path("api/auth/token/", TokenObtainPairRateLimitedView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Accounts
    path("api/accounts/me/", MeView.as_view(), name="accounts-me"),

    # Inventory actions
    path("api/inventory/receive/", ReceiveStockView.as_view(), name="inventory-receive"),
    path("api/inventory/transfer/", TransferStockView.as_view(), name="inventory-transfer"),
    path("api/inventory/adjust/", AdjustStockView.as_view(), name="inventory-adjust"),
    path(
        "api/inventory/alerts/low-stock/",
        LowStockAlertView.as_view(),
        name="inventory-low-stock",
    ),
    path(
        "api/inventory/alerts/near-expiry/",
        NearExpiryAlertView.as_view(),
        name="inventory-near-expiry",
    ),

    # POS
    path("api/sales/pos/sale/", SaleCreateView.as_view(), name="pos-sale-create"),
    path("api/sales/pos/<int:invoice_id>/pay/", SalePaymentView.as_view(), name="pos-sale-pay"),
    path("api/sales/pos/<int:invoice_id>/return/", SaleReturnView.as_view(), name="pos-sale-return"),
    path("api/sales/pos/<int:invoice_id>/receipt/", SaleReceiptView.as_view(), name="pos-sale-receipt"),

    # Reports module routes (kept as-is)
    path("api/", include("reports.urls")),

    # ViewSets router (masterdata/inventory/accounting/purchases etc)
    path("api/", include(router.urls)),
]
