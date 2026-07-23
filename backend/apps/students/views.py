from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ResourceNotFoundError
from apps.core.permissions import IsStudent
from apps.students.repositories.student_repository import StudentProfileRepository
from apps.students.serializers import (
    StudentProfileCreateSerializer,
    StudentProfileSerializer,
    StudentProfileUpdateSerializer,
)
from apps.students.services.profile_service import StudentProfileService


class MyStudentProfileView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        profile = StudentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")
        return Response({"success": True, "profile": StudentProfileSerializer(profile).data})

    def post(self, request):
        serializer = StudentProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = StudentProfileService().create_profile(request.user, **serializer.validated_data)
        return Response(
            {"success": True, "message": "Student profile created.", "profile": StudentProfileSerializer(profile).data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request):
        profile = StudentProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")

        serializer = StudentProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = StudentProfileService().update_profile(profile, **serializer.validated_data)
        return Response({"success": True, "profile": StudentProfileSerializer(updated).data})
