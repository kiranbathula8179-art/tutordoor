from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.models import Booking
from apps.bookings.repositories.reschedule_repository import RescheduleRepository
from apps.bookings.serializers import (
    BookingCreateSerializer,
    BookingSerializer,
    CancelBookingSerializer,
    LiveClassJoinSerializer,
    RescheduleCreateSerializer,
    RescheduleRequestSerializer,
    RescheduleRespondSerializer,
    SessionAttendanceSerializer,
    TutorNotesSerializer,
)
from apps.bookings.services.booking_service import BookingService
from apps.bookings.services.live_class_service import LiveClassService
from apps.bookings.services.reschedule_service import RescheduleService
from apps.core.exceptions import ApplicationError, PermissionDeniedError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsPlatformAdmin
from apps.parents.repositories.parent_repository import ParentProfileRepository, ParentStudentLinkRepository
from apps.students.repositories.student_repository import StudentProfileRepository
from apps.tutors.models import Subject
from apps.tutors.repositories.tutor_repository import TutorProfileRepository
from apps.users.models import UserRole


def _get_requesting_student_profile(request, requested_student_id=None):
    """
    Resolves which StudentProfile a booking action applies to: the logged-in
    student themself, or — if a parent is acting — a linked child they're
    authorized to manage bookings for.
    """
    if request.user.role == UserRole.STUDENT:
        profile = StudentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")
        return profile

    if request.user.role == UserRole.PARENT:
        if not requested_student_id:
            raise ApplicationError("student_id is required when booking as a parent.")

        parent_profile = ParentProfileRepository().get_by_user(request.user)
        if not parent_profile:
            raise ResourceNotFoundError("You have not created a parent profile yet.")

        student_profile = StudentProfileRepository().get_by_id(requested_student_id)
        if not student_profile:
            raise ApplicationError("Student not found.")

        link = ParentStudentLinkRepository().get(parent_profile, student_profile)
        if not link or link.status != "active" or not link.can_manage_bookings:
            raise PermissionDeniedError("You are not authorized to book on behalf of this student.")

        return student_profile

    raise PermissionDeniedError("Only students or parents can create bookings.")


class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student_profile = _get_requesting_student_profile(request, data.get("student_id"))

        tutor_profile = TutorProfileRepository().get_by_id(data["tutor_id"])
        if not tutor_profile:
            raise ApplicationError("Tutor not found.")

        subject = None
        if data.get("subject_id"):
            subject = Subject.objects.filter(id=data["subject_id"]).first()
            if not subject:
                raise ApplicationError("Subject not found.")

        booking = BookingService().create_booking(
            student=student_profile,
            tutor=tutor_profile,
            booked_by=request.user,
            start_time=data["start_time"],
            end_time=data["end_time"],
            booking_type=data["booking_type"],
            mode=data["mode"],
            subject=subject,
            location=data["location"],
            student_notes=data["student_notes"],
        )
        return Response(
            {"success": True, "message": "Booking created.", "booking": BookingSerializer(booking).data},
            status=status.HTTP_201_CREATED,
        )


class MyBookingsView(APIView):
    """Lists bookings for the current user, scoped automatically by their role."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        booking_repository = BookingRepository()
        status_filter = request.query_params.get("status")
        upcoming_only = request.query_params.get("upcoming") == "true"

        if request.user.role == UserRole.TUTOR:
            tutor_profile = TutorProfileRepository().get_by_user(request.user)
            if not tutor_profile:
                raise ResourceNotFoundError("You have not created a tutor profile yet.")
            queryset = booking_repository.list_for_tutor(
                tutor_profile, status=status_filter, upcoming_only=upcoming_only
            )
        elif request.user.role == UserRole.PARENT:
            parent_profile = ParentProfileRepository().get_by_user(request.user)
            if not parent_profile:
                raise ResourceNotFoundError("You have not created a parent profile yet.")
            queryset = booking_repository.list_for_parent(
                parent_profile, status=status_filter, upcoming_only=upcoming_only
            )
        else:
            student_profile = _get_requesting_student_profile(request)
            queryset = booking_repository.list_for_student(
                student_profile, status=status_filter, upcoming_only=upcoming_only
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(BookingSerializer(page, many=True).data)


def _get_booking_or_404(booking_id):
    booking = BookingRepository().get_by_id(booking_id)
    if not booking:
        raise ResourceNotFoundError("Booking not found.")
    return booking


def _ensure_participant(request, booking):
    if request.user.id not in (booking.student.user_id, booking.tutor.user_id) and not request.user.is_superuser:
        raise PermissionDeniedError("You are not a participant in this booking.")


class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        _ensure_participant(request, booking)
        return Response({"success": True, "booking": BookingSerializer(booking).data})


class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        serializer = CancelBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = BookingService().cancel_booking(
            booking, by_user=request.user, reason=serializer.validated_data["reason"]
        )
        return Response({"success": True, "message": "Booking cancelled.", "booking": BookingSerializer(updated).data})


class CompleteBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        if request.user.id != booking.tutor.user_id and not request.user.is_superuser:
            raise PermissionDeniedError("Only the tutor can mark a session as completed.")

        updated = BookingService().complete_booking(booking)
        return Response({"success": True, "booking": BookingSerializer(updated).data})


class MarkNoShowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        if request.user.id != booking.tutor.user_id and not request.user.is_superuser:
            raise PermissionDeniedError("Only the tutor can mark a student as a no-show.")

        updated = BookingService().mark_no_show(booking, marked_by=request.user)
        return Response({"success": True, "booking": BookingSerializer(updated).data})


class UpdateTutorNotesView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        if request.user.id != booking.tutor.user_id:
            raise PermissionDeniedError("Only the tutor can edit these notes.")

        serializer = TutorNotesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = BookingRepository().update(booking, tutor_notes=serializer.validated_data["tutor_notes"])
        return Response({"success": True, "booking": BookingSerializer(updated).data})


class RescheduleRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        serializer = RescheduleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reschedule_request = RescheduleService().request_reschedule(
            booking, requested_by=request.user, **serializer.validated_data
        )
        return Response(
            {"success": True, "reschedule_request": RescheduleRequestSerializer(reschedule_request).data},
            status=status.HTTP_201_CREATED,
        )


class RescheduleRequestRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        reschedule_request = RescheduleRepository().get_by_id(request_id)
        if not reschedule_request:
            raise ResourceNotFoundError("Reschedule request not found.")

        serializer = RescheduleRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = RescheduleService().respond(
            reschedule_request, responder=request.user, accept=serializer.validated_data["accept"]
        )
        return Response({"success": True, "reschedule_request": RescheduleRequestSerializer(updated).data})


class PendingReschedulesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        _ensure_participant(request, booking)

        pending = RescheduleRepository().get_pending_for_booking(booking)
        data = RescheduleRequestSerializer(pending).data if pending else None
        return Response({"success": True, "reschedule_request": data})


class LiveClassJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        details = LiveClassService().get_join_details(booking, request.user)
        return Response({"success": True, **LiveClassJoinSerializer(details).data})


class LiveClassLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        _ensure_participant(request, booking)
        LiveClassService().leave_session(booking, request.user)
        return Response({"success": True, "message": "Left the session."})


class SessionAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        booking = _get_booking_or_404(booking_id)
        _ensure_participant(request, booking)

        records = LiveClassService().get_attendance(booking)
        return Response({"success": True, "results": SessionAttendanceSerializer(records, many=True).data})


class AdminBookingListView(APIView):
    """Every booking on the platform, paginated, with status and participant search."""

    permission_classes = [IsPlatformAdmin]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        from django.db.models import Q

        queryset = Booking.objects.select_related("student__user", "tutor__user", "subject").order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        query = request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(student__user__email__icontains=query)
                | Q(student__user__first_name__icontains=query)
                | Q(student__user__last_name__icontains=query)
                | Q(tutor__user__email__icontains=query)
                | Q(tutor__user__first_name__icontains=query)
                | Q(tutor__user__last_name__icontains=query)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(BookingSerializer(page, many=True).data)
