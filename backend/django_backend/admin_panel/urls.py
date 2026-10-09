from django.urls import path

from monitoring.views import SystemHealthView

from .views import (
    AdminDashboardView,
    AdminTransactionExportView,
    AdminCardManagementView,
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

    path(
        "cards/",
        AdminCardManagementView.as_view(),
        name="admin-card-management-list",
    ),

    path(
        "cards/<int:card_id>/",
        AdminCardManagementView.as_view(),
        name="admin-card-management",
    ),

    path(
        "system-health/",
        SystemHealthView.as_view(),
        name="admin-system-health",
    ),
]