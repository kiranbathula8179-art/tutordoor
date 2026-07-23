from rest_framework import serializers
from apps.masterdata.fields import MasterDataSlugField

from apps.students.models import GradeLevel, LearningMode, StudentProfile, StudentSubjectInterest
from apps.tutors.models import ExpertiseLevel, Subject
from apps.tutors.serializers import SubjectSerializer
from apps.users.serializers import UserSerializer


class StudentSubjectInterestInputSerializer(serializers.Serializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.filter(is_active=True))
    current_level = serializers.ChoiceField(choices=ExpertiseLevel.choices, default=ExpertiseLevel.BEGINNER)

    def validate(self, attrs):
        attrs["subject_id"] = attrs["subject_id"].id
        return attrs


class StudentSubjectInterestSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = StudentSubjectInterest
        fields = ("id", "subject", "current_level")


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    subject_interests = StudentSubjectInterestSerializer(many=True, read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "id", "user", "date_of_birth", "grade_level", "school_name", "learning_goals",
            "preferred_learning_mode", "city", "state", "country", "latitude", "longitude",
            "subject_interests", "total_sessions_completed", "total_hours_learned", "created_at",
        )
        read_only_fields = ("id", "total_sessions_completed", "total_hours_learned", "created_at")


class StudentProfileCreateSerializer(serializers.Serializer):
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    grade_level = MasterDataSlugField("grade_level", max_length=20, default=GradeLevel.OTHER)
    school_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    learning_goals = serializers.CharField(required=False, allow_blank=True)
    preferred_learning_mode = serializers.ChoiceField(choices=LearningMode.choices, default=LearningMode.ONLINE)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, default="India")
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    preferred_subjects = StudentSubjectInterestInputSerializer(many=True, required=False, default=list)


class StudentProfileUpdateSerializer(StudentProfileCreateSerializer):
    def to_internal_value(self, data):
        self.fields = {k: v for k, v in self.fields.items() if k in data}
        return super().to_internal_value(data)
