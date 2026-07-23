import factory
from factory.django import DjangoModelFactory

from apps.institutes.models import InstituteProfile, VerificationStatus
from apps.users.models import UserRole
from apps.users.tests.factories import UserFactory


class InstituteUserFactory(UserFactory):
    role = UserRole.INSTITUTE_ADMIN


class InstituteProfileFactory(DjangoModelFactory):
    class Meta:
        model = InstituteProfile

    user = factory.SubFactory(InstituteUserFactory)
    institute_name = factory.Sequence(lambda n: f"Bright Minds Academy {n}")
    verification_status = VerificationStatus.VERIFIED
    city = "Pune"
