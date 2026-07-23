from rest_framework import serializers

from apps.reviews.models import CourseReview, TutorReview
from apps.students.serializers import StudentProfileSerializer


class TutorReviewSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = TutorReview
        fields = (
            "id", "booking", "student", "tutor", "rating", "comment",
            "tutor_response", "tutor_response_at", "created_at",
        )
        read_only_fields = ("id", "student", "tutor", "tutor_response", "tutor_response_at", "created_at")


class SubmitTutorReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default="")


class CourseReviewSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = CourseReview
        fields = (
            "id", "enrollment", "student", "course", "rating", "comment",
            "tutor_response", "tutor_response_at", "created_at",
        )
        read_only_fields = ("id", "student", "course", "tutor_response", "tutor_response_at", "created_at")


class SubmitCourseReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default="")


class ReviewResponseSerializer(serializers.Serializer):
    response = serializers.CharField()


class FlagReviewSerializer(serializers.Serializer):
    reason = serializers.CharField()
