from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, PermissionDeniedError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsStudent, IsTutor, IsVerifiedTutor
from apps.courses.models import CourseSessionStatus
from apps.courses.repositories.assignment_repository import AssignmentRepository, SubmissionRepository
from apps.courses.repositories.attendance_repository import AttendanceRepository
from apps.courses.repositories.course_repository import CourseRepository, CourseSessionRepository, EnrollmentRepository
from apps.courses.serializers import (
    AddSessionsSerializer,
    AssignmentCreateSerializer,
    AssignmentSerializer,
    CourseAttendanceSerializer,
    CourseCreateSerializer,
    CourseEnrollmentSerializer,
    CourseSerializer,
    GradeSubmissionSerializer,
    MarkAttendanceSerializer,
    ProgressReportSerializer,
    SubmissionSerializer,
    SubmitAssignmentSerializer,
)
from apps.courses.services.assignment_service import AssignmentService
from apps.courses.services.attendance_service import AttendanceService
from apps.courses.services.course_service import CourseService
from apps.courses.services.enrollment_service import EnrollmentService
from apps.courses.services.progress_service import ProgressService
from apps.courses.tasks import notify_new_assignment_task, notify_submission_graded_task
from apps.students.repositories.student_repository import StudentProfileRepository
from apps.tutors.models import Subject
from apps.tutors.repositories.tutor_repository import TutorProfileRepository


def _get_owned_course_or_403(request, course_id):
    course = CourseRepository().get_by_id(course_id)
    if not course:
        raise ResourceNotFoundError("Course not found.")
    if course.tutor.user_id != request.user.id and not request.user.is_superuser:
        raise PermissionDeniedError("You do not own this course.")
    return course


class CourseListCreateView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsVerifiedTutor()]
        return [AllowAny()]

    def get(self, request):
        courses = CourseRepository().list_published(
            subject_id=request.query_params.get("subject_id"),
            tutor_id=request.query_params.get("tutor_id"),
            level=request.query_params.get("level"),
            mode=request.query_params.get("mode"),
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(courses, request)
        return paginator.get_paginated_response(CourseSerializer(page, many=True).data)

    def post(self, request):
        serializer = CourseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        subject = Subject.objects.filter(id=data.pop("subject_id")).first()
        if not subject:
            raise ApplicationError("Subject not found.")

        tutor_profile = TutorProfileRepository().get_by_user(request.user)
        session_schedule = data.pop("session_schedule")

        course = CourseService().create_course(
            tutor=tutor_profile,
            created_by=request.user,
            subject=subject,
            session_schedule=session_schedule or None,
            **data,
        )
        return Response({"success": True, "course": CourseSerializer(course).data}, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = CourseRepository().get_by_id(course_id)
        if not course:
            raise ResourceNotFoundError("Course not found.")
        return Response({"success": True, "course": CourseSerializer(course).data})


class PublishCourseView(APIView):
    permission_classes = [IsVerifiedTutor]

    def post(self, request, course_id):
        course = _get_owned_course_or_403(request, course_id)
        updated = CourseService().publish(course)
        return Response({"success": True, "course": CourseSerializer(updated).data})


class AddCourseSessionsView(APIView):
    permission_classes = [IsVerifiedTutor]

    def post(self, request, course_id):
        course = _get_owned_course_or_403(request, course_id)
        serializer = AddSessionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        CourseService().add_sessions(course, serializer.validated_data["session_schedule"])
        course = CourseRepository().get_by_id(course_id)
        return Response({"success": True, "course": CourseSerializer(course).data})


class EnrollCourseView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, course_id):
        course = CourseRepository().get_by_id(course_id)
        if not course:
            raise ResourceNotFoundError("Course not found.")

        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")

        enrollment = EnrollmentService().enroll(course, student_profile)
        return Response(
            {"success": True, "enrollment": CourseEnrollmentSerializer(enrollment).data},
            status=status.HTTP_201_CREATED,
        )


class MyCourseEnrollmentsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")

        enrollments = EnrollmentRepository().list_for_student(student_profile, status=request.query_params.get("status"))
        return Response({"success": True, "results": CourseEnrollmentSerializer(enrollments, many=True).data})


class MyTeachingCoursesView(APIView):
    """All courses owned by the authenticated tutor, drafts included —
    the public list endpoint only ever exposes published courses."""

    permission_classes = [IsTutor]

    def get(self, request):
        tutor_profile = TutorProfileRepository().get_by_user(request.user)
        if not tutor_profile:
            raise ResourceNotFoundError("Create a tutor profile before managing courses.")

        courses = CourseRepository().list_for_tutor(tutor_profile, status=request.query_params.get("status"))
        return Response({"success": True, "results": CourseSerializer(courses, many=True).data})


class CourseEnrollmentsListView(APIView):
    permission_classes = [IsVerifiedTutor]

    def get(self, request, course_id):
        course = _get_owned_course_or_403(request, course_id)
        enrollments = EnrollmentRepository().list_for_course(course, status=request.query_params.get("status"))
        return Response({"success": True, "results": CourseEnrollmentSerializer(enrollments, many=True).data})


class DropEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, enrollment_id):
        enrollment = EnrollmentRepository().get_by_id(enrollment_id)
        if not enrollment:
            raise ResourceNotFoundError("Enrollment not found.")

        updated = EnrollmentService().drop(enrollment, by_user=request.user)
        return Response({"success": True, "enrollment": CourseEnrollmentSerializer(updated).data})


class AssignmentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseRepository().get_by_id(course_id)
        if not course:
            raise ResourceNotFoundError("Course not found.")
        assignments = AssignmentRepository().list_for_course(course)
        return Response({"success": True, "results": AssignmentSerializer(assignments, many=True).data})

    def post(self, request, course_id):
        course = _get_owned_course_or_403(request, course_id)
        serializer = AssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assignment = AssignmentService().create_assignment(course, created_by=request.user, **serializer.validated_data)
        notify_new_assignment_task.delay(str(assignment.id))
        return Response({"success": True, "assignment": AssignmentSerializer(assignment).data}, status=status.HTTP_201_CREATED)


class SubmitAssignmentView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, assignment_id):
        assignment = AssignmentRepository().get_by_id(assignment_id)
        if not assignment:
            raise ResourceNotFoundError("Assignment not found.")

        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")

        serializer = SubmitAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submission = AssignmentService().submit(assignment, student_profile, **serializer.validated_data)
        return Response({"success": True, "submission": SubmissionSerializer(submission).data}, status=status.HTTP_201_CREATED)


class AssignmentSubmissionsListView(APIView):
    permission_classes = [IsVerifiedTutor]

    def get(self, request, assignment_id):
        assignment = AssignmentRepository().get_by_id(assignment_id)
        if not assignment:
            raise ResourceNotFoundError("Assignment not found.")
        if assignment.course.tutor.user_id != request.user.id:
            raise PermissionDeniedError("You do not own this course.")

        submissions = SubmissionRepository().list_for_assignment(assignment)
        return Response({"success": True, "results": SubmissionSerializer(submissions, many=True).data})


class GradeSubmissionView(APIView):
    permission_classes = [IsVerifiedTutor]

    def post(self, request, submission_id):
        submission = SubmissionRepository().get_by_id(submission_id)
        if not submission:
            raise ResourceNotFoundError("Submission not found.")
        if submission.assignment.course.tutor.user_id != request.user.id:
            raise PermissionDeniedError("You do not own this course.")

        serializer = GradeSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        graded = AssignmentService().grade(submission, graded_by=request.user, **serializer.validated_data)
        notify_submission_graded_task.delay(str(graded.id))

        enrollment = EnrollmentRepository().get_active(submission.assignment.course, submission.student)
        if enrollment:
            ProgressService().compute_and_save(enrollment)

        return Response({"success": True, "submission": SubmissionSerializer(graded).data})


class MarkAttendanceView(APIView):
    permission_classes = [IsVerifiedTutor]

    def post(self, request, session_id):
        session = CourseSessionRepository().get_by_id(session_id)
        if not session:
            raise ResourceNotFoundError("Session not found.")
        if session.course.tutor.user_id != request.user.id:
            raise PermissionDeniedError("You do not own this course.")

        serializer = MarkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_profile = StudentProfileRepository().get_by_id(serializer.validated_data["student_id"])
        if not student_profile:
            raise ApplicationError("Student not found.")

        record = AttendanceService().mark_attendance(
            session, student_profile, status=serializer.validated_data["status"], marked_by=request.user
        )

        enrollment = EnrollmentRepository().get_active(session.course, student_profile)
        if enrollment:
            ProgressService().compute_and_save(enrollment)

        return Response({"success": True, "attendance": CourseAttendanceSerializer(record).data})


class SessionAttendanceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = CourseSessionRepository().get_by_id(session_id)
        if not session:
            raise ResourceNotFoundError("Session not found.")

        records = AttendanceService().list_for_session(session)
        return Response({"success": True, "results": CourseAttendanceSerializer(records, many=True).data})


class CourseSessionJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = CourseSessionRepository().get_by_id(session_id)
        if not session:
            raise ResourceNotFoundError("Session not found.")

        if request.user.role == "tutor":
            if session.course.tutor.user_id != request.user.id:
                raise PermissionDeniedError("You do not teach this course.")
            if session.status == CourseSessionStatus.SCHEDULED:
                CourseSessionRepository().update(session, status=CourseSessionStatus.LIVE, started_at=timezone.now())
        else:
            student_profile = StudentProfileRepository().get_by_user(request.user)
            if not student_profile:
                raise ResourceNotFoundError("You have not created a student profile yet.")
            AttendanceService().record_join(session, request.user, student_profile)

        return Response(
            {
                "success": True,
                "provider": "jitsi",
                "room_name": session.room_name,
                "jitsi_domain": settings.JITSI_DOMAIN,
                "join_url": f"https://{settings.JITSI_DOMAIN}/{session.room_name}",
            }
        )


class CourseSessionLeaveView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, session_id):
        session = CourseSessionRepository().get_by_id(session_id)
        if not session:
            raise ResourceNotFoundError("Session not found.")

        student_profile = StudentProfileRepository().get_by_user(request.user)
        if not student_profile:
            raise ResourceNotFoundError("You have not created a student profile yet.")

        AttendanceService().record_leave(session, student_profile)
        return Response({"success": True, "message": "Left the session."})


class ProgressReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseRepository().get_by_id(course_id)
        if not course:
            raise ResourceNotFoundError("Course not found.")

        if request.user.role == "tutor":
            if course.tutor.user_id != request.user.id:
                raise PermissionDeniedError("You do not own this course.")
            student_id = request.query_params.get("student_id")
            if not student_id:
                raise ApplicationError("student_id query parameter is required.")
            student_profile = StudentProfileRepository().get_by_id(student_id)
        else:
            student_profile = StudentProfileRepository().get_by_user(request.user)

        if not student_profile:
            raise ResourceNotFoundError("Student not found.")

        report = ProgressService().get_report(course, student_profile)
        return Response({"success": True, "report": ProgressReportSerializer(report).data})
