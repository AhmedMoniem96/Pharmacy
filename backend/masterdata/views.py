from rest_framework import viewsets

from accounts.audit import log_audit_event
from accounts.mixins import CompanyScopedModelViewSet
from accounts.models import get_user_company, scoped_branches
from accounts.permissions import IsAdminRoleOrReadOnly, IsSuperuser

from .models import Branch, Category, Company, Manufacturer, Product, Warehouse
from .serializers import (
    BranchSerializer,
    CategorySerializer,
    CompanySerializer,
    ManufacturerSerializer,
    ProductSerializer,
    WarehouseSerializer,
)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsSuperuser]


class BranchViewSet(CompanyScopedModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return Branch.objects.none()
        return self.filter_company_queryset(Branch.objects.all())


class WarehouseViewSet(CompanyScopedModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [IsAdminRoleOrReadOnly]
    company_lookup = "branch__company"
    company_create_field = None

    def get_queryset(self):
        branches = scoped_branches(self.request.user)
        queryset = Warehouse.objects.filter(branch__in=branches)
        return self.filter_company_queryset(queryset)


class CategoryViewSet(CompanyScopedModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class ManufacturerViewSet(CompanyScopedModelViewSet):
    queryset = Manufacturer.objects.all()
    serializer_class = ManufacturerSerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class ProductViewSet(CompanyScopedModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    def get_queryset(self):
        return self.filter_company_queryset(Product.objects.all())

    def perform_create(self, serializer):
        product = serializer.save(company=get_user_company(self.request.user))
        log_audit_event(
            company=product.company,
            user=self.request.user,
            action="CREATE",
            entity_type="Product",
            entity_id=product.id,
            summary=f"Created product {product.sku}",
        )

    def perform_update(self, serializer):
        product = serializer.save()
        log_audit_event(
            company=product.company,
            user=self.request.user,
            action="UPDATE",
            entity_type="Product",
            entity_id=product.id,
            summary=f"Updated product {product.sku}",
        )
