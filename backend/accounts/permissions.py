from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import UserProfile


class IsSuperuser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


def _get_role(user):
    profile = getattr(user, "profile", None)
    return profile.role if profile else None


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or _get_role(request.user) == UserProfile.Role.ADMIN


class IsAdminRoleOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return IsAdminRole().has_permission(request, view)


class BatchPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        if not request.user or not request.user.is_authenticated:
            return False
        role = _get_role(request.user)
        return request.user.is_superuser or role in {
            UserProfile.Role.ADMIN,
            UserProfile.Role.INVENTORY,
        }
