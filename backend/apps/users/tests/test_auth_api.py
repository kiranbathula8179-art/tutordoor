import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


class TestRegisterAPI:
    endpoint = "/api/v1/auth/register/"

    def test_register_creates_user_and_returns_tokens(self, api_client):
        payload = {
            "email": "newstudent@tutordoor.test",
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "Student",
            "role": "student",
        }
        response = api_client.post(self.endpoint, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "access" in response.data["tokens"]
        assert User.objects.filter(email=payload["email"]).exists()

    def test_register_rejects_duplicate_email(self, api_client):
        UserFactory(email="dupe@tutordoor.test")
        payload = {
            "email": "dupe@tutordoor.test",
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "Student",
            "role": "student",
        }
        response = api_client.post(self.endpoint, payload, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_register_rejects_weak_password(self, api_client):
        payload = {
            "email": "weak@tutordoor.test",
            "password": "weak",
            "first_name": "New",
            "last_name": "Student",
            "role": "student",
        }
        response = api_client.post(self.endpoint, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_rejects_admin_self_signup(self, api_client):
        payload = {
            "email": "wannabe-admin@tutordoor.test",
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "Admin",
            "role": "admin",
        }
        response = api_client.post(self.endpoint, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLoginAPI:
    endpoint = "/api/v1/auth/login/"

    def test_login_with_correct_credentials_succeeds(self, api_client):
        UserFactory(email="login@tutordoor.test", password="StrongPass123!")
        response = api_client.post(
            self.endpoint, {"email": "login@tutordoor.test", "password": "StrongPass123!"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data["tokens"]

    def test_login_with_wrong_password_fails(self, api_client):
        UserFactory(email="login2@tutordoor.test", password="StrongPass123!")
        response = api_client.post(
            self.endpoint, {"email": "login2@tutordoor.test", "password": "WrongPass123!"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_with_nonexistent_user_fails(self, api_client):
        response = api_client.post(
            self.endpoint, {"email": "ghost@tutordoor.test", "password": "WhoKnows123!"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestMeAPI:
    endpoint = "/api/v1/auth/me/"

    def test_me_requires_authentication(self, api_client):
        response = api_client.get(self.endpoint)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_returns_current_user(self, api_client):
        user = UserFactory(email="me@tutordoor.test", password="StrongPass123!")
        login_response = api_client.post(
            "/api/v1/auth/login/", {"email": "me@tutordoor.test", "password": "StrongPass123!"}, format="json"
        )
        access_token = login_response.data["tokens"]["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = api_client.get(self.endpoint)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["user"]["email"] == user.email
