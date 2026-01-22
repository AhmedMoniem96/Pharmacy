from django.urls import path

from .views import ReportSavedViewListCreateView, ReportScheduleListCreateView, ReportViewSet

report_query = ReportViewSet.as_view({"get": "list", "post": "list"})

urlpatterns = [
    path("reports/query/", report_query, name="reports-query"),
    path("reports/views/", ReportSavedViewListCreateView.as_view(), name="reports-views"),
    path(
        "reports/schedules/",
        ReportScheduleListCreateView.as_view(),
        name="reports-schedules",
    ),
]
