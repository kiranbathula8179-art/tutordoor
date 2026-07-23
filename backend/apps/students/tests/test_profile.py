import pytest
from rest_framework.test import APIClient

from apps.core.exceptions import ApplicationError, ConflictError
from apps.students.services.profile_service import StudentProfileService
from apps.users.models import UserRole
from apps.users.tests.factories import TutorUserFactory, UserFactory

pytestmark = pytest.mark.django_db


class TestStudentProfileService:
    def test_create_profile_succeeds_for_student_role(self):
        user = UserFactory(role=UserRole.STUDENT)
        profile = StudentProfileService().create_profile(user, grade_level="secondary", city="Mumbai")
        assert profile.user == user
        assert profile.city == "Mumbai"

    def test_create_profile_rejects_non_student_role(self):
        user = TutorUserFactory()
        with pytest.raises(ApplicationError):
            StudentProfileService().create_profile(user)

    def test_create_profile_rejects_duplicate(self):
        user = UserFactory(role=UserRole.STUDENT)
        StudentProfileService().create_profile(user)
        with pytest.raises(ConflictError):
            StudentProfileService().create_profile(user)


class TestMyStudentProfileAPI:
    endpoint = "/api/v1/students/me/profile/"

    def _authed_client(self, user, password="StrongPass123!"):
        client = APIClient()
        login = client.post("/api/v1/auth/login/", {"email": user.email, "password": password}, format="json")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['tokens']['access']}")
        return client

    def test_create_and_fetch_profile(self):
        user = UserFactory(role=UserRole.STUDENT, email="student1@tutordoor.test")
        client = self._authed_client(user)

        create_response = client.post(self.endpoint, {"grade_level": "middle", "city": "Delhi"}, format="json")
        assert create_response.status_code == 201

        get_response = client.get(self.endpoint)
        assert get_response.status_code == 200
        assert get_response.data["profile"]["city"] == "Delhi"
