from django.contrib.auth import get_user_model
from rest_framework import serializers

from masterdata.models import Branch, Company, Warehouse

from .models import UserProfile, scoped_branches, scoped_warehouses

User = get_user_model()

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
            "timezone",
            "company",
            "allowed_branches",
            "allowed_warehouses",
            "can_sell_expired",
        )

    def get_user(self, obj):
        return {
            "id": obj.user_id,
            "username": obj.user.username,
            "email": obj.user.email,
            "full_name": obj.user.first_name or "",
        }

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

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'company_name')

    def create(self, validated_data):
        company_name = validated_data.pop('company_name')
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email']
        )
        
        company = Company.objects.create(name=company_name)
        # Default to ADMIN role for the creator of the company
        UserProfile.objects.create(user=user, company=company, role='ADMIN')
            
        return user


class UserProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    role = serializers.CharField(required=False, allow_blank=True)
    timezone = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        user = instance.user
        if "full_name" in validated_data:
            user.first_name = validated_data["full_name"]
        if "email" in validated_data:
            user.email = validated_data["email"]
        if "role" in validated_data:
            instance.role = validated_data["role"]
        if "timezone" in validated_data:
            instance.timezone = validated_data["timezone"]
        user.save()
        instance.save()
        return instance


class InviteTeammateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, allow_blank=True, default="STAFF")
