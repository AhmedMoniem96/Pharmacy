from django.contrib.auth import get_user_model
from rest_framework import serializers

from masterdata.models import Branch, Company, Warehouse

from .models import UserProfile, scoped_branches, scoped_warehouses


class CompanyBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "name")


class BranchBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ("id", "name", "code")


class WarehouseBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ("id", "name", "code")


class UserProfileSerializer(serializers.ModelSerializer):
    company = CompanyBriefSerializer(read_only=True)
    allowed_branches = serializers.SerializerMethodField()
    allowed_warehouses = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = (
            "user",
            "role",
            "company",
            "allowed_branches",
            "allowed_warehouses",
            "can_sell_expired",
        )

    def get_user(self, obj):
        return {"id": obj.user_id, "username": obj.user.username, "email": obj.user.email}

    def get_allowed_branches(self, obj):
        branches = scoped_branches(obj.user)
        return BranchBriefSerializer(branches, many=True).data

    def get_allowed_warehouses(self, obj):
        warehouses = scoped_warehouses(obj.user)
        return WarehouseBriefSerializer(warehouses, many=True).data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email")
