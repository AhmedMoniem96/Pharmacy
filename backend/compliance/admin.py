from django.contrib import admin

from .models import RSDTransmissionLog, ZATCAInvoiceLog


@admin.register(ZATCAInvoiceLog)
class ZATCAInvoiceLogAdmin(admin.ModelAdmin):
    list_display = ("company", "ref", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("ref", "company__name")


@admin.register(RSDTransmissionLog)
class RSDTransmissionLogAdmin(admin.ModelAdmin):
    list_display = ("company", "ref", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("ref", "company__name")
