"""
Adds fraud_status / fraud_reason to transactions.

Some local databases already received these columns manually while the
FastAPI fraud service was being built, so the columns are only created
when they do not already exist. Django's migration state is updated in
both cases.
"""

from django.db import migrations, models


FRAUD_STATUS_FIELD = models.CharField(
    choices=[("CLEAR", "Clear"), ("FLAGGED", "Flagged")],
    default="CLEAR",
    max_length=20,
)

FRAUD_REASON_FIELD = models.TextField(
    blank=True,
    null=True,
)


def add_missing_columns(apps, schema_editor):
    Transaction = apps.get_model("transactions", "Transaction")
    table = Transaction._meta.db_table

    with schema_editor.connection.cursor() as cursor:
        existing = {
            column.name
            for column in schema_editor.connection.introspection
            .get_table_description(cursor, table)
        }

    for name, field in (
        ("fraud_status", FRAUD_STATUS_FIELD.clone()),
        ("fraud_reason", FRAUD_REASON_FIELD.clone()),
    ):
        if name not in existing:
            field.set_attributes_from_name(name)
            schema_editor.add_field(Transaction, field)


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0003_transaction_category"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    add_missing_columns,
                    migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="transaction",
                    name="fraud_status",
                    field=FRAUD_STATUS_FIELD,
                ),
                migrations.AddField(
                    model_name="transaction",
                    name="fraud_reason",
                    field=FRAUD_REASON_FIELD,
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["user", "-created_at"],
                name="txn_user_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["user", "status"],
                name="txn_user_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["fraud_status"],
                name="txn_fraud_status_idx",
            ),
        ),
    ]
