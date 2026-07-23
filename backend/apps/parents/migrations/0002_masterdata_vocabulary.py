from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("parents", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="parentstudentlink",
            name="relationship",
            field=models.CharField(default="guardian", max_length=20),
        ),
    ]
