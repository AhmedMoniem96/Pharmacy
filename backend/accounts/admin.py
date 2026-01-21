from django.contrib import admin

from .models import AuditLog, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "role", "can_sell_expired")
    list_filter = ("company", "role")
    search_fields = ("user__username", "user__email", "company__name")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "company", "user", "action", "entity_type", "entity_id")
    list_filter = ("company", "action", "entity_type")
    search_fields = ("entity_id", "summary", "user__username")
