from rest_framework import viewsets

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


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return Branch.objects.none()
        return Branch.objects.filter(company=company)

    def perform_create(self, serializer):
        serializer.save(company=get_user_company(self.request.user))


class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    def get_queryset(self):
        branches = scoped_branches(self.request.user)
        return Warehouse.objects.filter(branch__in=branches)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class ManufacturerViewSet(viewsets.ModelViewSet):
    queryset = Manufacturer.objects.all()
    serializer_class = ManufacturerSerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    def get_queryset(self):
        company = get_user_company(self.request.user)
        if not company:
            return Product.objects.none()
        return Product.objects.filter(company=company)

    def perform_create(self, serializer):
        serializer.save(company=get_user_company(self.request.user))
