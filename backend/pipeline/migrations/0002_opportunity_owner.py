from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
        ("pipeline", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="opportunity",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="opportunities",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
