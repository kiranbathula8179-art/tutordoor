import factory
from factory.django import DjangoModelFactory

from apps.students.models import StudentProfile
from apps.users.tests.factories import UserFactory


class StudentProfileFactory(DjangoModelFactory):
    class Meta:
        model = StudentProfile

    user = factory.SubFactory(UserFactory)
    grade_level = "secondary"
    city = "Bengaluru"
