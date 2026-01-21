from rest_framework import serializers

from accounts.models import get_user_company

from .models import Branch, Category, Company, Manufacturer, Product, Warehouse


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "name", "is_active", "created_at")
        read_only_fields = ("id", "created_at")


class BranchSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Branch
        fields = ("id", "company", "name", "code", "address", "is_active")


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ("id", "branch", "name", "code", "is_active")

    def validate_branch(self, branch):
        user = self.context["request"].user
        company = get_user_company(user)
        if company and branch.company_id != company.id:
            raise serializers.ValidationError("Branch does not belong to your company.")
        return branch


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "parent")


class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = ("id", "name")


class ProductSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "company",
            "type",
            "name",
            "sku",
            "barcode",
            "category",
            "manufacturer",
            "unit",
            "reorder_level",
            "is_active",
        )

    def validate(self, attrs):
        user = self.context["request"].user
        company = get_user_company(user)
        if not company:
            raise serializers.ValidationError("User is not associated with a company.")
        return attrs
