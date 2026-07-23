from rest_framework import serializers
from apps.masterdata.fields import MasterDataSlugField

from apps.courses.models import (
    Assignment,
    AssignmentSubmission,
    Course,
    CourseAttendance,
    CourseEnrollment,
    CourseSession,
    ExpertiseLevel,
    TeachingMode,
)
from apps.students.serializers import StudentProfileSerializer
from apps.tutors.serializers import SubjectSerializer, TutorProfileSerializer


class CourseSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSession
        fields = (
            "id", "session_number", "title", "description", "scheduled_start", "scheduled_end",
            "status", "started_at", "ended_at", "recording_url",
        )
        read_only_fields = ("id", "status", "started_at", "ended_at")


class SessionScheduleEntrySerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    scheduled_start = serializers.DateTimeField()
    scheduled_end = serializers.DateTimeField()

    def validate(self, attrs):
        if attrs["scheduled_end"] <= attrs["scheduled_start"]:
            raise serializers.ValidationError("Session end time must be after its start time.")
        return attrs


class CourseSerializer(serializers.ModelSerializer):
    tutor = TutorProfileSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    sessions = CourseSessionSerializer(many=True, read_only=True)
    enrolled_count = serializers.IntegerField(read_only=True)
    seats_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = (
            "id", "tutor", "subject", "title", "slug", "description", "thumbnail", "level", "mode",
            "total_sessions", "duration_weeks", "max_students", "price", "currency", "status",
            "start_date", "end_date", "sessions", "enrolled_count", "seats_available", "created_at",
        )
        read_only_fields = ("id", "slug", "status", "created_at")


class CourseCreateSerializer(serializers.Serializer):
    subject_id = serializers.UUIDField()
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    level = MasterDataSlugField("skill_level", max_length=20, default=ExpertiseLevel.ALL_LEVELS)
    mode = serializers.ChoiceField(choices=TeachingMode.choices, default=TeachingMode.ONLINE)
    total_sessions = serializers.IntegerField(min_value=1)
    duration_weeks = serializers.IntegerField(min_value=1, default=1)
    max_students = serializers.IntegerField(min_value=1, default=1)
    price = serializers.DecimalField(max_digits=9, decimal_places=2, min_value=0)
    currency = serializers.CharField(max_length=3, default="INR")
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    session_schedule = SessionScheduleEntrySerializer(many=True, required=False, default=list)


class AddSessionsSerializer(serializers.Serializer):
    session_schedule = SessionScheduleEntrySerializer(many=True)


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ("id", "course", "student", "status", "progress_percent", "enrolled_at", "completed_at")
        read_only_fields = fields


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ("id", "course", "session", "title", "instructions", "attachment", "max_score", "due_at", "created_at")
        read_only_fields = ("id", "created_at")


class AssignmentCreateSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(max_length=200)
    instructions = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)
    max_score = serializers.IntegerField(min_value=1, default=100)
    due_at = serializers.DateTimeField()


class SubmissionSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = (
            "id", "assignment", "student", "text_answer", "attachment", "submitted_at",
            "status", "score", "feedback", "graded_at",
        )
        read_only_fields = ("id", "submitted_at", "status", "score", "feedback", "graded_at")


class SubmitAssignmentSerializer(serializers.Serializer):
    text_answer = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)


class GradeSubmissionSerializer(serializers.Serializer):
    score = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, default="")


class CourseAttendanceSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = CourseAttendance
        fields = ("id", "session", "student", "status", "joined_at", "left_at")
        read_only_fields = fields


class MarkAttendanceSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=["present", "absent", "late", "excused"])


class ProgressReportSerializer(serializers.Serializer):
    total_sessions = serializers.IntegerField()
    attended_sessions = serializers.IntegerField()
    attendance_rate_percent = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_assignments = serializers.IntegerField()
    graded_assignments = serializers.IntegerField()
    assignment_completion_percent = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    overall_progress_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
