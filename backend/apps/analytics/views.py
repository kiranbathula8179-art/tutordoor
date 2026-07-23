from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, ResourceNotFoundError
from apps.core.permissions import IsPlatformAdmin, IsStudent, IsTutor
from apps.analytics.serializers import (
    AdminDashboardSummarySerializer,
    DailyPlatformMetricsSerializer,
    MetricsTrendQuerySerializer,
    RevenueReportQuerySerializer,
    RevenueReportRowSerializer,
    StudentDashboardSummarySerializer,
    TopSubjectSerializer,
    TutorDashboardSummarySerializer,
)
from apps.analytics.services.analytics_service import (
    AdminAnalyticsService,
    MetricsSnapshotService,
    StudentAnalyticsService,
    TutorAnalyticsService,
)
from apps.tutors.serializers import TutorProfileSerializer


class AdminDashboardView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        summary = AdminAnalyticsService().get_dashboard_summary()
        return Response({"success": True, "summary": AdminDashboardSummarySerializer(summary).data})


class AdminTopTutorsView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        tutors = AdminAnalyticsService().get_top_tutors(limit=int(request.query_params.get("limit", 10)))
        return Response({"success": True, "results": TutorProfileSerializer(tutors, many=True).data})


class AdminTopSubjectsView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        subjects = AdminAnalyticsService().get_top_subjects(limit=int(request.query_params.get("limit", 10)))
        return Response({"success": True, "results": TopSubjectSerializer(subjects, many=True).data})


class AdminRevenueReportView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        serializer = RevenueReportQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        rows = AdminAnalyticsService().get_revenue_report(**serializer.validated_data)
        return Response({"success": True, "results": RevenueReportRowSerializer(rows, many=True).data})


class AdminMetricsTrendView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        serializer = MetricsTrendQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if (data["end_date"] - data["start_date"]).days > 366:
            raise ApplicationError("Date range cannot exceed a year.")

        snapshots = MetricsSnapshotService().get_trend(data["start_date"], data["end_date"])
        return Response({"success": True, "results": DailyPlatformMetricsSerializer(snapshots, many=True).data})


class TutorDashboardView(APIView):
    permission_classes = [IsTutor]

    def get(self, request):
        from apps.tutors.repositories.tutor_repository import TutorProfileRepository

        tutor_profile = TutorProfileRepository().get_by_user(request.user)
        if not tutor_profile:
            raise ResourceNotFoundError("You have not created a tutor profile yet.")

        summary = TutorAnalyticsService().get_dashboard_summary(tutor_profile)
        return Response({"success": True, "summary": TutorDashboardSummarySerializer(summary).data})


class StudentDashboardView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        from apps.students.repositories.student_repository import StudentProfileRepository

        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")

        summary = StudentAnalyticsService().get_dashboard_summary(student_profile)
        return Response({"success": True, "summary": StudentDashboardSummarySerializer(summary).data})
