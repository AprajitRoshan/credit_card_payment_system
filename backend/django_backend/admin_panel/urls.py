from django.urls import path

from .views import (
    AdminDashboardView,
    AdminTransactionExportView,
)


urlpatterns = [
    path(
        "dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),
    path(
        "transactions/export/",
        AdminTransactionExportView.as_view(),
        name="admin-transaction-export",
    ),
]