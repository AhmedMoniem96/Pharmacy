from rest_framework import viewsets

from accounts.models import get_user_company


class CompanyScopedQuerysetMixin:
    company_lookup = "company"
    company_create_field = "company"

    def get_company(self):
        return get_user_company(self.request.user)

    def filter_company_queryset(self, queryset):
        company = self.get_company()
        if not company:
            return queryset.none()
        return queryset.filter(**{self.company_lookup: company})

    def get_queryset(self):
        queryset = super().get_queryset()
        return self.filter_company_queryset(queryset)

    def perform_create(self, serializer):
        company = self.get_company()
        if self.company_create_field and company:
            serializer.save(**{self.company_create_field: company})
        else:
            serializer.save()


class CompanyScopedModelViewSet(CompanyScopedQuerysetMixin, viewsets.ModelViewSet):
    pass


class CompanyScopedReadOnlyModelViewSet(
    CompanyScopedQuerysetMixin, viewsets.ReadOnlyModelViewSet
):
    pass
