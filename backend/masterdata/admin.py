from django.contrib import admin

from .models import Branch, Category, Company, Manufacturer, Product, Warehouse


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "company", "is_active")
    search_fields = ("name", "code", "company__name")
    list_filter = ("company", "is_active")


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "branch", "is_active")
    search_fields = ("name", "code", "branch__name")
    list_filter = ("branch", "is_active")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "parent")
    search_fields = ("name", "company__name")
    list_filter = ("company",)


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ("name", "company")
    search_fields = ("name", "company__name")
    list_filter = ("company",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "company", "type", "is_active")
    search_fields = ("name", "sku", "barcode")
    list_filter = ("company", "type", "is_active")
