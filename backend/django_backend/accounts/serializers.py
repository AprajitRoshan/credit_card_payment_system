from rest_framework import serializers
from .models import Role, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
        )
        user.set_password(validated_data["password"])

        # New sign-ups are customers; staff roles are assigned by an admin.
        user.role = Role.objects.filter(name=Role.CUSTOMER).first()

        user.save()

        return user