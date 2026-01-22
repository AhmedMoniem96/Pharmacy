from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_auditlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="timezone",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
    ]
