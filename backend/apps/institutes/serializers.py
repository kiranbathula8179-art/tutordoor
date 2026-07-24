from rest_framework import serializers

from apps.institutes.models import InstituteProfile, InstituteStudentEnrollment, InstituteTutor
from apps.tutors.serializers import TutorProfileSerializer
from apps.students.serializers import StudentProfileSerializer
from apps.users.serializers import UserSerializer


class InstituteProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = InstituteProfile
        fields = (
            "id", "user", "institute_name", "registration_number", "description", "logo", "website",
            "established_year", "address", "city", "state", "country", "latitude", "longitude",
            "verification_status", "is_verified", "rejection_reason", "rating_average", "rating_count", "created_at",
        )
        read_only_fields = (
            "id",
            "verification_status",
            "is_verified",
            "rejection_reason",
            "rating_average",
            "rating_count",
            "created_at",
        )


class InstituteProfileCreateSerializer(serializers.Serializer):
    institute_name = serializers.CharField(max_length=255)
    registration_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    established_year = serializers.IntegerField(required=False, allow_null=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, default="India")
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)


class InstituteProfileUpdateSerializer(InstituteProfileCreateSerializer):
    institute_name = serializers.CharField(max_length=255, required=False)

    def to_internal_value(self, data):
        self.fields = {k: v for k, v in self.fields.items() if k in data}
        return super().to_internal_value(data)


class InstituteRejectSerializer(serializers.Serializer):
    reason = serializers.CharField()


class InstituteTutorLinkSerializer(serializers.ModelSerializer):
    tutor = TutorProfileSerializer(read_only=True)

    class Meta:
        model = InstituteTutor
        fields = ("id", "tutor", "role_title", "status", "joined_at", "created_at")
        read_only_fields = fields


class InviteTutorSerializer(serializers.Serializer):
    tutor_id = serializers.UUIDField()
    role_title = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")


class RespondToInviteSerializer(serializers.Serializer):
    accept = serializers.BooleanField()


class TutorInstituteLinkSerializer(serializers.ModelSerializer):
    """The tutor's view of an institute link — nests the institute, not the tutor."""

    institute = serializers.SerializerMethodField()

    class Meta:
        model = InstituteTutor
        fields = ("id", "institute", "role_title", "status", "joined_at", "created_at")
        read_only_fields = fields

    def get_institute(self, obj):
        return {
            "id": str(obj.institute.id),
            "institute_name": obj.institute.institute_name,
            "city": obj.institute.city,
            "is_verified": obj.institute.is_verified,
        }


class InstituteEnrollmentSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = InstituteStudentEnrollment
        fields = ("id", "student", "status", "enrolled_at", "notes")
        read_only_fields = fields


class EnrollStudentSerializer(serializers.Serializer):
    student_id = serializers.UUIDField(required=False)
    student_email = serializers.EmailField(required=False)

    def validate(self, attrs):
        if not attrs.get("student_id") and not attrs.get("student_email"):
            raise serializers.ValidationError("Provide either student_id or student_email.")
        return attrs
