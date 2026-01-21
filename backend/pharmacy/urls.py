from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import MeView
from inventory.views import BatchViewSet, StockLedgerViewSet
from masterdata.views import (
    BranchViewSet,
    CategoryViewSet,
    CompanyViewSet,
    ManufacturerViewSet,
    ProductViewSet,
    WarehouseViewSet,
)


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

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/accounts/me/", MeView.as_view(), name="accounts-me"),
    path("api/", include(router.urls)),
]
