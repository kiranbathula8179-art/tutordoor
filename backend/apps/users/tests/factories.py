import factory
from factory.django import DjangoModelFactory

from apps.users.models import User, UserRole


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("email",)

    email = factory.Sequence(lambda n: f"user{n}@tutordoor.test")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = UserRole.STUDENT
    is_email_verified = True
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        raw_password = extracted or "StrongPass123!"
        self.set_password(raw_password)
        if create:
            self.save(update_fields=["password"])


class TutorUserFactory(UserFactory):
    role = UserRole.TUTOR


class ParentUserFactory(UserFactory):
    role = UserRole.PARENT


class AdminUserFactory(UserFactory):
    role = UserRole.ADMIN
    is_staff = True
    is_superuser = True
