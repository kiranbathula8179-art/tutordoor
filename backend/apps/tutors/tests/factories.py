import factory
from factory.django import DjangoModelFactory

from apps.tutors.models import Subject, SubjectCategory, TutorProfile, VerificationStatus
from apps.users.tests.factories import TutorUserFactory


class SubjectCategoryFactory(DjangoModelFactory):
    class Meta:
        model = SubjectCategory
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")


class SubjectFactory(DjangoModelFactory):
    class Meta:
        model = Subject
        django_get_or_create = ("slug",)

    category = factory.SubFactory(SubjectCategoryFactory)
    name = factory.Sequence(lambda n: f"Subject {n}")
    slug = factory.Sequence(lambda n: f"subject-{n}")


class TutorProfileFactory(DjangoModelFactory):
    class Meta:
        model = TutorProfile

    user = factory.SubFactory(TutorUserFactory)
    headline = "Experienced Mathematics Tutor"
    hourly_rate = 500
    verification_status = VerificationStatus.VERIFIED
    is_accepting_students = True
    city = "Bengaluru"
