from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("tutors", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="tutorsubject",
            name="expertise_level",
            field=models.CharField(default="all_levels", max_length=20),
        ),
        migrations.AlterField(
            model_name="verificationdocument",
            name="document_type",
            field=models.CharField(max_length=30),
        ),
    ]
