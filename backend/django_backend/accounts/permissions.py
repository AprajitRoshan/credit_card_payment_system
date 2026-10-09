
from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None

    role = getattr(user, "role", None)
    return role.name if role else None


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return get_user_role(request.user) == "ADMIN"


class CanViewAdminData(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method not in SAFE_METHODS:
            return False

        return get_user_role(request.user) in {
            "ADMIN",
            "SUPPORT",
            "READ_ONLY",
        }


class CanManageCards(BasePermission):
    def has_permission(self, request, view):
        role = get_user_role(request.user)

        if role == "ADMIN":
            return True

        if request.method in SAFE_METHODS:
            return role in {"SUPPORT", "READ_ONLY"}

        if role == "SUPPORT" and request.method == "PATCH":
            return (
                "credit_limit" not in request.data
                and "is_blocked" in request.data
            )

        return False


class CanReviewFraud(BasePermission):
    """
    Admin and Support can update fraud reviews.
    Read-Only can only view (handled by CanViewAdminData).
    """

    def has_permission(self, request, view):
        return get_user_role(request.user) in {"ADMIN", "SUPPORT"}
