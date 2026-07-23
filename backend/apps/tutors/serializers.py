from rest_framework import serializers
from apps.masterdata.fields import MasterDataSlugField

from apps.tutors.models import (
    AvailabilityException,
    ExpertiseLevel,
    Subject,
    SubjectCategory,
    TeachingMode,
    TutorProfile,
    TutorSubject,
    VerificationDocument,
    WeeklyAvailability,
)
from apps.users.serializers import UserSerializer


class SubjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectCategory
        fields = ("id", "name", "slug", "icon", "display_order")


class SubjectSerializer(serializers.ModelSerializer):
    category = SubjectCategorySerializer(read_only=True)

    class Meta:
        model = Subject
        fields = ("id", "name", "slug", "description", "category")


class TutorSubjectSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        source="subject", queryset=Subject.objects.filter(is_active=True), write_only=True
    )

    class Meta:
        model = TutorSubject
        fields = ("id", "subject", "subject_id", "expertise_level", "years_experience")


class TutorSubjectInputSerializer(serializers.Serializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.filter(is_active=True))
    expertise_level = MasterDataSlugField("skill_level", max_length=20, default=ExpertiseLevel.ALL_LEVELS)
    years_experience = serializers.IntegerField(min_value=0, max_value=60, default=0)

    def validate(self, attrs):
        attrs["subject_id"] = attrs["subject_id"].id
        return attrs


class TutorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tutor_subjects = TutorSubjectSerializer(many=True, read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    distance_km = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = TutorProfile
        fields = (
            "id", "user", "headline", "bio", "education", "experience_years",
            "hourly_rate", "currency", "teaching_mode", "languages", "intro_video_url",
            "address", "city", "state", "country", "latitude", "longitude", "travel_radius_km",
            "verification_status", "is_verified", "rejection_reason",
            "rating_average", "rating_count", "total_sessions_completed", "response_time_minutes",
            "is_featured", "is_accepting_students", "tutor_subjects", "distance_km", "created_at",
        )
        read_only_fields = (
            "id", "verification_status", "is_verified", "rejection_reason", "rating_average",
            "rating_count", "total_sessions_completed", "is_featured", "created_at",
        )


class TutorProfileCreateSerializer(serializers.Serializer):
    headline = serializers.CharField(max_length=150, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(max_length=255, required=False, allow_blank=True)
    experience_years = serializers.IntegerField(min_value=0, max_value=60, default=0)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=0)
    currency = serializers.CharField(max_length=3, default="INR")
    teaching_mode = serializers.ChoiceField(choices=TeachingMode.choices, default=TeachingMode.ONLINE)
    languages = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, default="India")
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    travel_radius_km = serializers.IntegerField(min_value=0, max_value=200, default=10)
    subjects = TutorSubjectInputSerializer(many=True, required=False, default=list)


class TutorProfileUpdateSerializer(TutorProfileCreateSerializer):
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=0, required=False)

    def to_internal_value(self, data):
        # Allow partial updates: only validate keys actually present in the payload.
        self.fields = {k: v for k, v in self.fields.items() if k in data}
        return super().to_internal_value(data)


class VerificationDocumentSerializer(serializers.ModelSerializer):
    document_type = MasterDataSlugField("document_type", max_length=30)

    class Meta:
        model = VerificationDocument
        fields = ("id", "document_type", "file", "status", "admin_notes", "reviewed_at", "created_at")
        read_only_fields = ("id", "status", "admin_notes", "reviewed_at", "created_at")


class AdminVerificationDocumentSerializer(VerificationDocumentSerializer):
    """Adds the owning tutor's identity for the admin review queue."""

    tutor = serializers.SerializerMethodField()

    class Meta(VerificationDocumentSerializer.Meta):
        fields = VerificationDocumentSerializer.Meta.fields + ("tutor",)

    def get_tutor(self, obj):
        return {
            "id": str(obj.tutor.id),
            "full_name": obj.tutor.user.full_name,
            "email": obj.tutor.user.email,
            "headline": obj.tutor.headline,
            "verification_status": obj.tutor.verification_status,
        }


class DocumentReviewSerializer(serializers.Serializer):
    approve = serializers.BooleanField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class TutorRejectSerializer(serializers.Serializer):
    reason = serializers.CharField()


class WeeklyAvailabilitySlotSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()


class WeeklyAvailabilityOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyAvailability
        fields = ("id", "day_of_week", "start_time", "end_time", "is_active")


class SetWeeklyAvailabilitySerializer(serializers.Serializer):
    slots = WeeklyAvailabilitySlotSerializer(many=True)


class AvailabilityExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityException
        fields = ("id", "date", "is_available", "start_time", "end_time", "reason")


class AvailableSlotsQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    slot_duration_minutes = serializers.IntegerField(min_value=15, max_value=240, default=60)


class TutorSearchQuerySerializer(serializers.Serializer):
    subject_id = serializers.UUIDField(required=False)
    query = serializers.CharField(required=False, allow_blank=True)
    teaching_mode = serializers.ChoiceField(choices=TeachingMode.choices, required=False)
    min_price = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    min_rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    city = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    max_distance_km = serializers.FloatField(required=False)
