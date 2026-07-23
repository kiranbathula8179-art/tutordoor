import pytest

from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestUserModel:
    def test_referral_code_is_generated_on_save(self):
        user = UserFactory()
        assert user.referral_code
        assert len(user.referral_code) == 8

    def test_referral_codes_are_unique(self):
        user_one = UserFactory()
        user_two = UserFactory()
        assert user_one.referral_code != user_two.referral_code

    def test_get_full_name(self):
        user = UserFactory(first_name="Ada", last_name="Lovelace")
        assert user.get_full_name() == "Ada Lovelace"

    def test_password_is_hashed(self):
        user = UserFactory(password="SuperSecret123!")
        assert user.password != "SuperSecret123!"
        assert user.check_password("SuperSecret123!")

    def test_str_representation(self):
        user = UserFactory(first_name="Ada", last_name="Lovelace", email="ada@tutordoor.test")
        assert str(user) == "Ada Lovelace <ada@tutordoor.test>"
