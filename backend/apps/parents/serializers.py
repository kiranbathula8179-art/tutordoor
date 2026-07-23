from rest_framework import serializers
from apps.masterdata.fields import MasterDataSlugField

from apps.parents.models import ParentProfile, ParentStudentLink, RelationshipType
from apps.students.serializers import StudentProfileSerializer
from apps.users.serializers import UserSerializer


class ParentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ParentProfile
        fields = ("id", "user", "occupation", "city", "preferred_contact_method", "receives_progress_reports", "created_at")
        read_only_fields = ("id", "created_at")


class ParentProfileCreateSerializer(serializers.Serializer):
    occupation = serializers.CharField(max_length=150, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    preferred_contact_method = serializers.ChoiceField(
        choices=["email", "sms", "whatsapp"], default="email"
    )
    receives_progress_reports = serializers.BooleanField(default=True)


class ParentStudentLinkSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = ParentStudentLink
        fields = (
            "id", "student", "relationship", "status",
            "can_manage_bookings", "can_manage_payments", "can_view_progress", "confirmed_at",
        )
        read_only_fields = fields


class InviteStudentSerializer(serializers.Serializer):
    student_email = serializers.EmailField()
    relationship = MasterDataSlugField("relationship_type", max_length=20, default=RelationshipType.GUARDIAN)


class ConfirmLinkSerializer(serializers.Serializer):
    token = serializers.CharField()
