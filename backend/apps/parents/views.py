from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ResourceNotFoundError
from apps.core.permissions import IsParent
from apps.parents.repositories.parent_repository import ParentProfileRepository
from apps.parents.serializers import (
    ConfirmLinkSerializer,
    InviteStudentSerializer,
    ParentProfileCreateSerializer,
    ParentProfileSerializer,
    ParentStudentLinkSerializer,
)
from apps.parents.services.parent_service import ParentProfileService, ParentStudentLinkService


class MyParentProfileView(APIView):
    permission_classes = [IsParent]

    def get(self, request):
        profile = ParentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a parent profile yet.")
        return Response({"success": True, "profile": ParentProfileSerializer(profile).data})

    def post(self, request):
        serializer = ParentProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = ParentProfileService().create_profile(request.user, **serializer.validated_data)
        return Response(
            {"success": True, "message": "Parent profile created.", "profile": ParentProfileSerializer(profile).data},
            status=status.HTTP_201_CREATED,
        )


class MyChildrenView(APIView):
    permission_classes = [IsParent]

    def get(self, request):
        profile = ParentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a parent profile yet.")

        links = ParentStudentLinkService().list_children(profile)
        return Response({"success": True, "results": ParentStudentLinkSerializer(links, many=True).data})

    def post(self, request):
        profile = ParentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a parent profile yet.")

        serializer = InviteStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        link = ParentStudentLinkService().invite_student(profile, **serializer.validated_data)
        return Response(
            {
                "success": True,
                "message": "Invitation sent. The student must confirm the link via email.",
                "link": ParentStudentLinkSerializer(link).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmParentLinkView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        link = ParentStudentLinkService().confirm_link(serializer.validated_data["token"])
        return Response(
            {"success": True, "message": "Link confirmed.", "link": ParentStudentLinkSerializer(link).data}
        )


class ChildEnrollmentsView(APIView):
    """A parent with an active, progress-visible link can list a child's course
    enrollments (progress_percent included) for the progress report page."""

    permission_classes = [IsParent]

    def get(self, request, student_id):
        from apps.courses.repositories.course_repository import EnrollmentRepository
        from apps.courses.serializers import CourseEnrollmentSerializer
        from apps.parents.models import LinkStatus
        from apps.parents.repositories.parent_repository import ParentStudentLinkRepository
        from apps.students.repositories.student_repository import StudentProfileRepository

        profile = ParentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a parent profile yet.")

        student = StudentProfileRepository().get_by_id(student_id)
        if not student:
            raise ResourceNotFoundError("Student not found.")

        link = ParentStudentLinkRepository().get(profile, student)
        if not link or link.status != LinkStatus.ACTIVE or not link.can_view_progress:
            raise ResourceNotFoundError("No progress-visible link with this student.")

        enrollments = EnrollmentRepository().list_for_student(student)
        return Response({"success": True, "results": CourseEnrollmentSerializer(enrollments, many=True).data})
