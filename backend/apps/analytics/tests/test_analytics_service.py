import datetime
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.analytics.services.analytics_service import (
    AdminAnalyticsService,
    MetricsSnapshotService,
    StudentAnalyticsService,
    TutorAnalyticsService,
)
from apps.bookings.models import BookingStatus, PaymentStatus as BookingPaymentStatus
from apps.bookings.tests.factories import BookingFactory
from apps.payments.services.payout_service import PayoutService

pytestmark = pytest.mark.django_db


class TestTutorAnalyticsService:
    def test_dashboard_reflects_upcoming_and_earnings(self):
        booking = BookingFactory(
            status=BookingStatus.COMPLETED,
            payment_status=BookingPaymentStatus.PAID,
            price=Decimal("1000.00"),
            start_time=timezone.now() - datetime.timedelta(hours=2),
            end_time=timezone.now() - datetime.timedelta(hours=1),
        )
        PayoutService().credit_tutor_for_booking(booking)

        summary = TutorAnalyticsService().get_dashboard_summary(booking.tutor)
        assert summary["total_earnings"] > 0
        assert summary["total_sessions_completed"] == booking.tutor.total_sessions_completed


class TestStudentAnalyticsService:
    def test_dashboard_reflects_upcoming_sessions(self):
        booking = BookingFactory(status=BookingStatus.CONFIRMED)
        summary = StudentAnalyticsService().get_dashboard_summary(booking.student)
        assert summary["upcoming_sessions"] == 1


class TestAdminAnalyticsService:
    def test_dashboard_summary_counts_users(self):
        BookingFactory()
        summary = AdminAnalyticsService().get_dashboard_summary()
        assert summary["total_users"] >= 2  # at least the student + tutor just created
        assert "bookings_by_status" in summary


class TestMetricsSnapshotService:
    def test_snapshot_for_date_creates_a_record(self):
        BookingFactory()
        today = timezone.now().date()

        snapshot = MetricsSnapshotService().snapshot_for_date(today)
        assert snapshot.date == today
        assert snapshot.total_bookings_created >= 1
