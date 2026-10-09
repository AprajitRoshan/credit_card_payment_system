
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    ADMIN = "ADMIN"
    SUPPORT = "SUPPORT"
    READ_ONLY = "READ_ONLY"
    CUSTOMER = "CUSTOMER"

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (SUPPORT, "Support"),
        (READ_ONLY, "Read-Only"),
        (CUSTOMER, "Customer"),
    ]

    name = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        unique=True,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    def __str__(self):
        return self.get_name_display()


class User(AbstractUser):
    email = models.EmailField(unique=True)

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )

    def __str__(self):
        return self.username
