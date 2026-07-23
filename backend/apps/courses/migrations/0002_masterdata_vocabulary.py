from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("courses", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="course",
            name="level",
            field=models.CharField(default="all_levels", max_length=20),
        ),
    ]
