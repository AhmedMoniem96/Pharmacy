from django.contrib import admin

from .models import Batch, StockLedger


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "batch_no",
        "warehouse",
        "expiry_date",
        "qty_on_hand",
    )
    list_filter = ("warehouse", "expiry_date")
    search_fields = ("product__name", "batch_no")


@admin.register(StockLedger)
class StockLedgerAdmin(admin.ModelAdmin):
    list_display = (
        "movement_type",
        "product",
        "warehouse",
        "qty",
        "created_at",
    )
    list_filter = ("movement_type", "warehouse", "created_at")
    search_fields = ("product__name", "ref_type", "ref_id")
