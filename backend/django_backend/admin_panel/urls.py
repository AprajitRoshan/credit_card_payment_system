from django.urls import path

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
]