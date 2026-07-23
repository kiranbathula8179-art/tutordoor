from rest_framework import serializers

from apps.bookings.models import (
    Booking,
    BookingMode,
    BookingType,
    RescheduleRequest,
    SessionAttendance,
)
from apps.students.serializers import StudentProfileSerializer
from apps.tutors.serializers import SubjectSerializer, TutorProfileSerializer


class BookingSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    tutor = TutorProfileSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    is_demo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id", "student", "tutor", "subject", "booking_type", "mode", "status",
            "start_time", "end_time", "duration_minutes", "price", "currency", "payment_status",
            "location", "student_notes", "tutor_notes", "is_demo",
            "cancellation_reason", "cancelled_at", "is_late_cancellation", "completed_at", "created_at",
        )
        read_only_fields = (
            "id", "status", "price", "payment_status", "cancellation_reason", "cancelled_at",
            "is_late_cancellation", "completed_at", "created_at",
        )


class BookingCreateSerializer(serializers.Serializer):
    tutor_id = serializers.UUIDField()
    subject_id = serializers.UUIDField(required=False, allow_null=True)
    booking_type = serializers.ChoiceField(choices=BookingType.choices, default=BookingType.REGULAR)
    mode = serializers.ChoiceField(choices=BookingMode.choices, default=BookingMode.ONLINE)
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    location = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    student_notes = serializers.CharField(required=False, allow_blank=True, default="")
    student_id = serializers.UUIDField(
        required=False, help_text="Only used when a parent is booking on behalf of a linked child."
    )


class CancelBookingSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class TutorNotesSerializer(serializers.Serializer):
    tutor_notes = serializers.CharField(allow_blank=True)


class RescheduleRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RescheduleRequest
        fields = (
            "id", "booking", "requested_by", "proposed_start_time", "proposed_end_time",
            "reason", "status", "responded_at", "created_at",
        )
        read_only_fields = fields


class RescheduleCreateSerializer(serializers.Serializer):
    proposed_start_time = serializers.DateTimeField()
    proposed_end_time = serializers.DateTimeField()
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class RescheduleRespondSerializer(serializers.Serializer):
    accept = serializers.BooleanField()


class LiveClassJoinSerializer(serializers.Serializer):
    provider = serializers.CharField()
    room_name = serializers.CharField()
    jitsi_domain = serializers.CharField()
    join_url = serializers.URLField()
    display_name = serializers.CharField()


class SessionAttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = SessionAttendance
        fields = ("id", "user_name", "role", "joined_at", "left_at", "duration_seconds")
        read_only_fields = fields
