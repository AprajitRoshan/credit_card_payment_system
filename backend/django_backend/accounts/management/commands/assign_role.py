from django.core.management.base import BaseCommand, CommandError

from accounts.models import Role, User


class Command(BaseCommand):
    help = "Assign a role to a user. Example: python manage.py assign_role admin ADMIN"

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument(
            "role",
            choices=[name for name, _ in Role.ROLE_CHOICES],
        )

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options["username"])
        except User.DoesNotExist:
            raise CommandError(f"User '{options['username']}' not found.")

        role, _ = Role.objects.get_or_create(name=options["role"])

        user.role = role
        user.save(update_fields=["role"])

        self.stdout.write(
            self.style.SUCCESS(f"{user.username} is now {role.name}.")
        )
