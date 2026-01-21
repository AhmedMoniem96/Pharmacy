from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "role", "can_sell_expired")
    list_filter = ("company", "role")
    search_fields = ("user__username", "user__email", "company__name")
    filter_horizontal = ("allowed_branches", "allowed_warehouses")
