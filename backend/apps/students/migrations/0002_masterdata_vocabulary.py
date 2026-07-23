from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("students", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="studentprofile",
            name="grade_level",
            field=models.CharField(default="other", max_length=20),
        ),
        migrations.AlterField(
            model_name="studentsubjectinterest",
            name="current_level",
            field=models.CharField(default="beginner", max_length=20),
        ),
    ]
