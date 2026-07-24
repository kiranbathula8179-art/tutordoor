from django.urls import path

from apps.courses import views

app_name = "courses"

urlpatterns = [
    path("", views.CourseListCreateView.as_view(), name="list_create"),
    path("me/enrollments/", views.MyCourseEnrollmentsView.as_view(), name="my_enrollments"),
    path("me/teaching/", views.MyTeachingCoursesView.as_view(), name="my_teaching"),
    path("enrollments/<uuid:enrollment_id>/drop/", views.DropEnrollmentView.as_view(), name="drop_enrollment"),
    path("submissions/<uuid:submission_id>/grade/", views.GradeSubmissionView.as_view(), name="grade_submission"),
    path("assignments/<uuid:assignment_id>/submit/", views.SubmitAssignmentView.as_view(), name="submit_assignment"),
    path(
        "assignments/<uuid:assignment_id>/submissions/",
        views.AssignmentSubmissionsListView.as_view(),
        name="assignment_submissions",
    ),
    path("sessions/<uuid:session_id>/attendance/mark/", views.MarkAttendanceView.as_view(), name="mark_attendance"),
    path(
        "sessions/<uuid:session_id>/attendance/", views.SessionAttendanceListView.as_view(), name="session_attendance"
    ),
    path("sessions/<uuid:session_id>/join/", views.CourseSessionJoinView.as_view(), name="session_join"),
    path("sessions/<uuid:session_id>/leave/", views.CourseSessionLeaveView.as_view(), name="session_leave"),
    path("<uuid:course_id>/", views.CourseDetailView.as_view(), name="detail"),
    path("<uuid:course_id>/publish/", views.PublishCourseView.as_view(), name="publish"),
    path("<uuid:course_id>/sessions/", views.AddCourseSessionsView.as_view(), name="add_sessions"),
    path("<uuid:course_id>/enroll/", views.EnrollCourseView.as_view(), name="enroll"),
    path("<uuid:course_id>/enrollments/", views.CourseEnrollmentsListView.as_view(), name="course_enrollments"),
    path("<uuid:course_id>/assignments/", views.AssignmentListCreateView.as_view(), name="assignments"),
    path("<uuid:course_id>/progress/", views.ProgressReportView.as_view(), name="progress"),
]
