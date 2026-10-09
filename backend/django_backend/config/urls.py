from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    path("api/health/", include("monitoring.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/cards/", include("cards.urls")),
    path("api/transactions/", include("transactions.urls")),
    path("api/admin-panel/", include("admin_panel.urls")),
    path("api/admin/", include("admin_panel.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/statements/", include("statements.urls")),
    path("api/fraud/", include("fraud.urls")),
]
