from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsPlatformAdmin, IsTutor
from apps.tutors.models import TutorProfile, VerificationDocument
from apps.tutors.repositories.tutor_repository import SubjectRepository, TutorProfileRepository
from apps.tutors.serializers import (
    AdminVerificationDocumentSerializer,
    AvailabilityExceptionSerializer,
    AvailableSlotsQuerySerializer,
    DocumentReviewSerializer,
    SetWeeklyAvailabilitySerializer,
    SubjectCategorySerializer,
    SubjectSerializer,
    TutorProfileCreateSerializer,
    TutorProfileSerializer,
    TutorProfileUpdateSerializer,
    TutorRejectSerializer,
    TutorSearchQuerySerializer,
    VerificationDocumentSerializer,
    WeeklyAvailabilityOutputSerializer,
)
from apps.tutors.services.availability_service import AvailabilityService
from apps.tutors.services.profile_service import TutorProfileService
from apps.tutors.services.search_service import TutorSearchService
from apps.tutors.services.verification_service import VerificationService


class SubjectCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = SubjectRepository().list_categories()
        return Response({"success": True, "results": SubjectCategorySerializer(categories, many=True).data})


class SubjectListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category_id = request.query_params.get("category_id")
        subjects = SubjectRepository().list_subjects(category_id=category_id)
        return Response({"success": True, "results": SubjectSerializer(subjects, many=True).data})


class MyTutorProfileView(APIView):
    """Create/view/update the authenticated tutor's own profile."""

    permission_classes = [IsTutor]

    def get(self, request):
        profile = TutorProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a tutor profile yet.")
        return Response({"success": True, "profile": TutorProfileSerializer(profile).data})

    def post(self, request):
        serializer = TutorProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = TutorProfileService().create_profile(request.user, **serializer.validated_data)
        return Response(
            {"success": True, "message": "Tutor profile created.", "profile": TutorProfileSerializer(profile).data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request):
        profile = TutorProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a tutor profile yet.")

        serializer = TutorProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = TutorProfileService().update_profile(profile, **serializer.validated_data)
        return Response({"success": True, "profile": TutorProfileSerializer(updated).data})


class TutorPublicDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, tutor_id):
        profile = TutorProfileRepository().get_by_id(tutor_id)
        if not profile:
            raise ResourceNotFoundError("Tutor not found.")
        return Response({"success": True, "profile": TutorProfileSerializer(profile).data})


class TutorSearchView(APIView):
    """Smart tutor search: filters by subject, price, rating, mode, and geo-distance."""

    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        serializer = TutorSearchQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        params = serializer.validated_data
        if "subject_id" in params:
            params["subject_id"] = str(params["subject_id"])

        queryset = TutorSearchService().search(**params)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        data = TutorProfileSerializer(page, many=True).data
        return paginator.get_paginated_response(data)


class VerificationDocumentListCreateView(APIView):
    permission_classes = [IsTutor]

    def _get_profile(self, request):
        profile = TutorProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("Create a tutor profile before submitting verification documents.")
        return profile

    def get(self, request):
        profile = self._get_profile(request)
        documents = VerificationService().verification_repository.list_for_tutor(profile)
        return Response({"success": True, "results": VerificationDocumentSerializer(documents, many=True).data})

    def post(self, request):
        profile = self._get_profile(request)
        serializer = VerificationDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = VerificationService().submit_document(
            profile,
            document_type=serializer.validated_data["document_type"],
            file=serializer.validated_data["file"],
        )
        return Response(
            {"success": True, "document": VerificationDocumentSerializer(document).data},
            status=status.HTTP_201_CREATED,
        )


class AdminPendingVerificationsView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        documents = VerificationService().list_pending_reviews()
        return Response({"success": True, "results": AdminVerificationDocumentSerializer(documents, many=True).data})


class AdminReviewDocumentView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, document_id):
        document = get_object_or_404(VerificationDocument, id=document_id)
        serializer = DocumentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = VerificationService().review_document(
            document,
            reviewer=request.user,
            approve=serializer.validated_data["approve"],
            notes=serializer.validated_data["notes"],
        )
        return Response({"success": True, "document": VerificationDocumentSerializer(updated).data})


class AdminApproveTutorView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, tutor_id):
        profile = get_object_or_404(TutorProfile, id=tutor_id)
        updated = VerificationService().approve_tutor(profile, reviewer=request.user)
        return Response(
            {"success": True, "message": "Tutor approved.", "profile": TutorProfileSerializer(updated).data}
        )


class AdminRejectTutorView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, tutor_id):
        profile = get_object_or_404(TutorProfile, id=tutor_id)
        serializer = TutorRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = VerificationService().reject_tutor(
            profile, reviewer=request.user, reason=serializer.validated_data["reason"]
        )
        return Response(
            {"success": True, "message": "Tutor rejected.", "profile": TutorProfileSerializer(updated).data}
        )


class MyWeeklyAvailabilityView(APIView):
    permission_classes = [IsTutor]

    def _get_profile(self, request):
        profile = TutorProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("Create a tutor profile before setting availability.")
        return profile

    def get(self, request):
        profile = self._get_profile(request)
        slots = AvailabilityService().get_weekly_template(profile)
        return Response({"success": True, "results": WeeklyAvailabilityOutputSerializer(slots, many=True).data})

    def put(self, request):
        profile = self._get_profile(request)
        serializer = SetWeeklyAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        slots = AvailabilityService().set_weekly_template(profile, serializer.validated_data["slots"])
        return Response({"success": True, "results": WeeklyAvailabilityOutputSerializer(slots, many=True).data})


class MyAvailabilityExceptionsView(APIView):
    permission_classes = [IsTutor]

    def _get_profile(self, request):
        profile = TutorProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("Create a tutor profile before managing availability.")
        return profile

    def get(self, request):
        profile = self._get_profile(request)
        exceptions = AvailabilityService().list_exceptions(profile)
        return Response({"success": True, "results": AvailabilityExceptionSerializer(exceptions, many=True).data})

    def post(self, request):
        profile = self._get_profile(request)
        serializer = AvailabilityExceptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exception = AvailabilityService().add_exception(profile, **serializer.validated_data)
        return Response(
            {"success": True, "exception": AvailabilityExceptionSerializer(exception).data},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, exception_id):
        profile = self._get_profile(request)
        AvailabilityService().remove_exception(profile, exception_id)
        return Response({"success": True, "message": "Availability exception removed."})


class TutorAvailableSlotsView(APIView):
    """Public endpoint: computes bookable slots for a tutor within a date range."""

    permission_classes = [AllowAny]

    def get(self, request, tutor_id):
        profile = get_object_or_404(TutorProfile, id=tutor_id)

        serializer = AvailableSlotsQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        params = serializer.validated_data

        if (params["end_date"] - params["start_date"]).days > 30:
            raise ApplicationError("Date range cannot exceed 30 days.")

        slots = AvailabilityService().get_available_slots(
            profile,
            start_date=params["start_date"],
            end_date=params["end_date"],
            slot_duration_minutes=params["slot_duration_minutes"],
        )
        return Response(
            {
                "success": True,
                "results": [{"start": start.isoformat(), "end": end.isoformat()} for start, end in slots],
            }
        )
