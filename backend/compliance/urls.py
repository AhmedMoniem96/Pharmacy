from django.urls import path

from .views import (
    RSDLogDetailView,
    RSDLogListView,
    RSDMovementSendView,
    ZATCAInvoiceSendView,
    ZATCALogDetailView,
    ZATCALogListView,
)

urlpatterns = [
    path(
        "compliance/zatca/invoices/<int:invoice_id>/send/",
        ZATCAInvoiceSendView.as_view(),
        name="zatca-invoice-send",
    ),
    path("compliance/zatca/logs/", ZATCALogListView.as_view(), name="zatca-log-list"),
    path(
        "compliance/zatca/logs/<int:log_id>/",
        ZATCALogDetailView.as_view(),
        name="zatca-log-detail",
    ),
    path(
        "compliance/rsd/movements/send/",
        RSDMovementSendView.as_view(),
        name="rsd-movement-send",
    ),
    path("compliance/rsd/logs/", RSDLogListView.as_view(), name="rsd-log-list"),
    path(
        "compliance/rsd/logs/<int:log_id>/",
        RSDLogDetailView.as_view(),
        name="rsd-log-detail",
    ),
]
