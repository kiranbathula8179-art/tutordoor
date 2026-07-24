from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PermissionDeniedError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.reviews.repositories.review_repository import CourseReviewRepository, TutorReviewRepository
from apps.reviews.serializers import (
    CourseReviewSerializer,
    FlagReviewSerializer,
    ReviewResponseSerializer,
    SubmitCourseReviewSerializer,
    SubmitTutorReviewSerializer,
    TutorReviewSerializer,
)
from apps.reviews.services.review_service import CourseReviewService, TutorReviewService


class SubmitTutorReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        from apps.bookings.repositories.booking_repository import BookingRepository
        from apps.students.repositories.student_repository import StudentProfileRepository

        booking = BookingRepository().get_by_id(booking_id)
        if not booking:
            raise ResourceNotFoundError("Booking not found.")

        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You do not have a student profile.")

        serializer = SubmitTutorReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = TutorReviewService().submit_review(booking, student_profile, **serializer.validated_data)
        return Response({"success": True, "review": TutorReviewSerializer(review).data}, status=status.HTTP_201_CREATED)


class TutorReviewListView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get(self, request, tutor_id):
        from apps.tutors.repositories.tutor_repository import TutorProfileRepository

        tutor = TutorProfileRepository().get_by_id(tutor_id)
        if not tutor:
            raise ResourceNotFoundError("Tutor not found.")

        reviews = TutorReviewRepository().list_for_tutor(tutor)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(reviews, request)
        return paginator.get_paginated_response(TutorReviewSerializer(page, many=True).data)


class RespondToTutorReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        review = TutorReviewRepository().get_by_id(review_id)
        if not review:
            raise ResourceNotFoundError("Review not found.")

        serializer = ReviewResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = TutorReviewService().add_response(review, tutor_user=request.user, **serializer.validated_data)
        return Response({"success": True, "review": TutorReviewSerializer(updated).data})


class FlagTutorReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        if not request.user.is_superuser:
            raise PermissionDeniedError("Only platform admins can flag reviews.")

        review = TutorReviewRepository().get_by_id(review_id)
        if not review:
            raise ResourceNotFoundError("Review not found.")

        serializer = FlagReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = TutorReviewService().flag(review, **serializer.validated_data)
        return Response({"success": True, "review": TutorReviewSerializer(updated).data})


class SubmitCourseReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, enrollment_id):
        from apps.courses.repositories.course_repository import EnrollmentRepository
        from apps.students.repositories.student_repository import StudentProfileRepository

        enrollment = EnrollmentRepository().get_by_id(enrollment_id)
        if not enrollment:
            raise ResourceNotFoundError("Enrollment not found.")

        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You do not have a student profile.")

        serializer = SubmitCourseReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = CourseReviewService().submit_review(enrollment, student_profile, **serializer.validated_data)
        return Response(
            {"success": True, "review": CourseReviewSerializer(review).data}, status=status.HTTP_201_CREATED
        )


class CourseReviewListView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get(self, request, course_id):
        from apps.courses.repositories.course_repository import CourseRepository

        course = CourseRepository().get_by_id(course_id)
        if not course:
            raise ResourceNotFoundError("Course not found.")

        reviews = CourseReviewRepository().list_for_course(course)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(reviews, request)
        return paginator.get_paginated_response(CourseReviewSerializer(page, many=True).data)


class RespondToCourseReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        review = CourseReviewRepository().get_by_id(review_id)
        if not review:
            raise ResourceNotFoundError("Review not found.")

        serializer = ReviewResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = CourseReviewService().add_response(review, tutor_user=request.user, **serializer.validated_data)
        return Response({"success": True, "review": CourseReviewSerializer(updated).data})
