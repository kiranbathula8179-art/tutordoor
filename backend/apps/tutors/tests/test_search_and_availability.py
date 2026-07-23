import datetime

import pytest
from rest_framework.test import APIClient

from apps.tutors.models import WeeklyAvailability
from apps.tutors.services.availability_service import AvailabilityService
from apps.tutors.tests.factories import SubjectFactory, TutorProfileFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


class TestTutorSearchAPI:
    endpoint = "/api/v1/tutors/search/"

    def test_search_returns_only_verified_tutors(self, api_client):
        verified = TutorProfileFactory(hourly_rate=500)
        TutorProfileFactory(verification_status="pending", hourly_rate=400)

        response = api_client.get(self.endpoint)

        assert response.status_code == 200
        emails = [t["user"]["email"] for t in response.data["results"]]
        assert verified.user.email in emails
        assert len(response.data["results"]) == 1

    def test_search_filters_by_subject(self, api_client):
        subject = SubjectFactory()
        matching = TutorProfileFactory(hourly_rate=500)
        matching.tutor_subjects.create(subject=subject)
        TutorProfileFactory(hourly_rate=500)

        response = api_client.get(self.endpoint, {"subject_id": str(subject.id)})

        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["user"]["email"] == matching.user.email

    def test_search_filters_by_price_range(self, api_client):
        TutorProfileFactory(hourly_rate=200)
        expensive = TutorProfileFactory(hourly_rate=900)

        response = api_client.get(self.endpoint, {"min_price": "500"})

        assert response.status_code == 200
        emails = [t["user"]["email"] for t in response.data["results"]]
        assert expensive.user.email in emails
        assert len(response.data["results"]) == 1


class TestAvailabilityService:
    def test_get_available_slots_respects_weekly_template_and_exceptions(self):
        tutor = TutorProfileFactory()
        monday = 0
        WeeklyAvailability.objects.create(
            tutor=tutor, day_of_week=monday, start_time=datetime.time(9, 0), end_time=datetime.time(11, 0)
        )

        # Find the next Monday from today for a deterministic range.
        today = datetime.date.today()
        days_ahead = (monday - today.weekday()) % 7 or 7
        next_monday = today + datetime.timedelta(days=days_ahead)

        service = AvailabilityService()
        slots = service.get_available_slots(tutor, next_monday, next_monday, slot_duration_minutes=60)

        assert len(slots) == 2
        assert slots[0][0].time() == datetime.time(9, 0)
        assert slots[1][0].time() == datetime.time(10, 0)

    def test_blocked_exception_removes_all_slots_for_that_date(self):
        tutor = TutorProfileFactory()
        monday = 0
        WeeklyAvailability.objects.create(
            tutor=tutor, day_of_week=monday, start_time=datetime.time(9, 0), end_time=datetime.time(11, 0)
        )
        today = datetime.date.today()
        days_ahead = (monday - today.weekday()) % 7 or 7
        next_monday = today + datetime.timedelta(days=days_ahead)

        service = AvailabilityService()
        service.add_exception(tutor, date=next_monday, is_available=False, reason="On leave")

        slots = service.get_available_slots(tutor, next_monday, next_monday)
        assert slots == []
