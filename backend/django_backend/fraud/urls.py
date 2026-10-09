from django.urls import path

from .views import FraudLogListView, FraudLogReviewView


urlpatterns = [
    path(
        "logs/",
        FraudLogListView.as_view(),
        name="fraud-log-list",
    ),
    path(
        "logs/<int:log_id>/review/",
        FraudLogReviewView.as_view(),
        name="fraud-log-review",
    ),
]
