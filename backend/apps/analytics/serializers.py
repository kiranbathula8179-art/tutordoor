from rest_framework import serializers

from apps.analytics.models import DailyPlatformMetrics
from apps.tutors.serializers import TutorProfileSerializer


class AdminDashboardSummarySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    users_by_role = serializers.DictField()
    new_signups_this_month = serializers.IntegerField()
    pending_tutor_verifications = serializers.IntegerField()
    bookings_by_status = serializers.DictField()
    revenue_this_month = serializers.DecimalField(max_digits=14, decimal_places=2)
    active_subscriptions = serializers.IntegerField()


class TopSubjectSerializer(serializers.Serializer):
    subject__name = serializers.CharField()
    booking_count = serializers.IntegerField()


class RevenueReportRowSerializer(serializers.Serializer):
    purpose = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    transaction_count = serializers.IntegerField()


class RevenueReportQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()


class TutorDashboardSummarySerializer(serializers.Serializer):
    upcoming_sessions = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    wallet_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    rating_average = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_count = serializers.IntegerField()
    total_sessions_completed = serializers.IntegerField()
    completion_rate_percent = serializers.FloatField()


class StudentDashboardSummarySerializer(serializers.Serializer):
    upcoming_sessions = serializers.IntegerField()
    total_sessions_completed = serializers.IntegerField()
    total_hours_learned = serializers.DecimalField(max_digits=8, decimal_places=2)
    active_course_enrollments = serializers.IntegerField()


class DailyPlatformMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyPlatformMetrics
        fields = (
            "date", "total_users", "total_tutors", "total_students", "new_signups",
            "total_bookings_created", "completed_bookings", "cancelled_bookings",
            "gross_merchandise_value", "platform_revenue", "active_subscriptions",
        )
        read_only_fields = fields


class MetricsTrendQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
