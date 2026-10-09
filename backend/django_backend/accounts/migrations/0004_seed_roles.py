from django.db import migrations


ROLES = [
    ("ADMIN", "Full access: card management, credit limits, exports, fraud review."),
    ("SUPPORT", "Can view admin data, block/unblock cards and review fraud logs."),
    ("READ_ONLY", "Can view admin dashboards, analytics and logs only."),
    ("CUSTOMER", "Regular customer account."),
]


def seed_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")

    for name, description in ROLES:
        Role.objects.get_or_create(
            name=name,
            defaults={"description": description},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_role_name"),
    ]

    operations = [
        migrations.RunPython(seed_roles, migrations.RunPython.noop),
    ]
