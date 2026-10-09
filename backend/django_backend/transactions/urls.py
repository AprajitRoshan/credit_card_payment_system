from django.urls import path

from .analytics import AnalyticsExportView, TransactionAnalyticsView
from .views import TransactionListView


urlpatterns = [
    path(
        "",
        TransactionListView.as_view(),
        name="transaction-list",
    ),
    path(
        "analytics/",
        TransactionAnalyticsView.as_view(),
        name="transaction-analytics",
    ),
    path(
        "analytics/export/<str:file_format>/",
        AnalyticsExportView.as_view(),
        name="transaction-analytics-export",
    ),
]
