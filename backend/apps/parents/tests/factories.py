import factory
from factory.django import DjangoModelFactory

from apps.parents.models import ParentProfile
from apps.users.tests.factories import ParentUserFactory


class ParentProfileFactory(DjangoModelFactory):
    class Meta:
        model = ParentProfile

    user = factory.SubFactory(ParentUserFactory)
    city = "Chennai"
