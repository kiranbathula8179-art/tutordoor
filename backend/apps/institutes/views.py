from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, ResourceNotFoundError
from apps.core.permissions import IsInstituteAdmin, IsPlatformAdmin, IsTutor
from apps.institutes.models import InstituteProfile
from apps.institutes.repositories.institute_repository import InstituteProfileRepository
from apps.institutes.serializers import (
    EnrollStudentSerializer,
    InstituteEnrollmentSerializer,
    InstituteProfileCreateSerializer,
    InstituteProfileSerializer,
    InstituteProfileUpdateSerializer,
    InstituteRejectSerializer,
    InstituteTutorLinkSerializer,
    InviteTutorSerializer,
    RespondToInviteSerializer,
    TutorInstituteLinkSerializer,
)
from apps.institutes.repositories.institute_repository import InstituteTutorRepository
from apps.institutes.services.profile_service import InstituteProfileService
from apps.institutes.services.roster_service import InstituteRosterService
from apps.students.repositories.student_repository import StudentProfileRepository
from apps.tutors.repositories.tutor_repository import TutorProfileRepository


class MyInstituteProfileView(APIView):
    permission_classes = [IsInstituteAdmin]

    def get(self, request):
        profile = InstituteProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created an institute profile yet.")
        return Response({"success": True, "profile": InstituteProfileSerializer(profile).data})

    def post(self, request):
        serializer = InstituteProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = InstituteProfileService().create_profile(request.user, **serializer.validated_data)
        return Response(
            {
                "success": True,
                "message": "Institute profile created. Awaiting verification.",
                "profile": InstituteProfileSerializer(profile).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request):
        profile = InstituteProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created an institute profile yet.")

        serializer = InstituteProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = InstituteProfileService().update_profile(profile, **serializer.validated_data)
        return Response({"success": True, "profile": InstituteProfileSerializer(updated).data})


class InstitutePublicDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, institute_id):
        profile = InstituteProfileRepository().get_by_id(institute_id)
        if not profile:
            raise ResourceNotFoundError("Institute not found.")
        return Response({"success": True, "profile": InstituteProfileSerializer(profile).data})


class AdminApproveInstituteView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, institute_id):
        profile = get_object_or_404(InstituteProfile, id=institute_id)
        updated = InstituteProfileService().approve(profile, reviewer=request.user)
        return Response({"success": True, "profile": InstituteProfileSerializer(updated).data})


class AdminRejectInstituteView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, institute_id):
        profile = get_object_or_404(InstituteProfile, id=institute_id)
        serializer = InstituteRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = InstituteProfileService().reject(
            profile, reviewer=request.user, reason=serializer.validated_data["reason"]
        )
        return Response({"success": True, "profile": InstituteProfileSerializer(updated).data})


class InstituteTutorRosterView(APIView):
    permission_classes = [IsInstituteAdmin]

    def _get_institute(self, request):
        profile = InstituteProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created an institute profile yet.")
        return profile

    def get(self, request):
        institute = self._get_institute(request)
        links = InstituteRosterService().list_tutors(institute, status=request.query_params.get("status"))
        return Response({"success": True, "results": InstituteTutorLinkSerializer(links, many=True).data})

    def post(self, request):
        institute = self._get_institute(request)
        serializer = InviteTutorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tutor_profile = TutorProfileRepository().get_by_id(serializer.validated_data["tutor_id"])
        if not tutor_profile:
            raise ApplicationError("Tutor not found.")

        link = InstituteRosterService().invite_tutor(
            institute, tutor_profile, role_title=serializer.validated_data["role_title"]
        )
        return Response(
            {"success": True, "link": InstituteTutorLinkSerializer(link).data}, status=status.HTTP_201_CREATED
        )


class MyInstituteInvitesView(APIView):
    """Institute links for the authenticated tutor — pending invites and active
    memberships — so the respond endpoint has something to respond to."""

    permission_classes = [IsTutor]

    def get(self, request):
        tutor_profile = TutorProfileRepository().get_by_user(request.user)
        if not tutor_profile:
            raise ResourceNotFoundError("You do not have a tutor profile.")

        links = InstituteTutorRepository().list_for_tutor(tutor_profile, status=request.query_params.get("status"))
        return Response({"success": True, "results": TutorInstituteLinkSerializer(links, many=True).data})


class TutorRespondToInstituteInviteView(APIView):
    permission_classes = [IsTutor]

    def post(self, request, institute_id):
        tutor_profile = TutorProfileRepository().get_by_user(request.user)
        if not tutor_profile:
            raise ResourceNotFoundError("You do not have a tutor profile.")

        institute = InstituteProfileRepository().get_by_id(institute_id)
        if not institute:
            raise ApplicationError("Institute not found.")

        serializer = RespondToInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        link = InstituteRosterService().respond_to_invite(
            institute, tutor_profile, accept=serializer.validated_data["accept"]
        )
        return Response({"success": True, "link": InstituteTutorLinkSerializer(link).data})


class InstituteStudentEnrollmentView(APIView):
    permission_classes = [IsInstituteAdmin]

    def _get_institute(self, request):
        profile = InstituteProfileRepository().get_by_user(request.user)
        if not profile:
            raise ResourceNotFoundError("You have not created an institute profile yet.")
        return profile

    def get(self, request):
        institute = self._get_institute(request)
        enrollments = InstituteRosterService().list_students(institute, status=request.query_params.get("status"))
        return Response({"success": True, "results": InstituteEnrollmentSerializer(enrollments, many=True).data})

    def post(self, request):
        institute = self._get_institute(request)
        serializer = EnrollStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_profile = None
        if serializer.validated_data.get("student_id"):
            student_profile = StudentProfileRepository().get_by_id(serializer.validated_data["student_id"])
        elif serializer.validated_data.get("student_email"):
            from apps.users.repositories.user_repository import UserRepository

            user = UserRepository().get_by_email(serializer.validated_data["student_email"])
            if user:
                student_profile = StudentProfileRepository().get_by_user(user)
        if not student_profile:
            raise ApplicationError("No student account found for that identifier.")

        enrollment = InstituteRosterService().enroll_student(institute, student_profile)
        return Response(
            {"success": True, "enrollment": InstituteEnrollmentSerializer(enrollment).data},
            status=status.HTTP_201_CREATED,
        )
