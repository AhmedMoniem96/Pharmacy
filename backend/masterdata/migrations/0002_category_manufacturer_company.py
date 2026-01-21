from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("masterdata", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="company",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="categories", to="masterdata.company"),
        ),
        migrations.AddField(
            model_name="manufacturer",
            name="company",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="manufacturers", to="masterdata.company"),
        ),
    ]
