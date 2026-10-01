from django.contrib import admin

from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "card_type",
        "card_holder_name",
        "masked_card_number",
        "last_four_digits",
        "expiry_month",
        "expiry_year",
    )
    search_fields = ("card_holder_name", "last_four_digits")
    list_filter = ("card_type",)