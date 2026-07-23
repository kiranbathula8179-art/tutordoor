from django.urls import path

from apps.institutes import views

app_name = "institutes"

urlpatterns = [
    path("me/profile/", views.MyInstituteProfileView.as_view(), name="my_profile"),
    path("me/tutors/", views.InstituteTutorRosterView.as_view(), name="my_tutor_roster"),
    path("me/students/", views.InstituteStudentEnrollmentView.as_view(), name="my_student_enrollments"),
    path("tutor/invites/", views.MyInstituteInvitesView.as_view(), name="tutor_invites"),
    path(
        "<uuid:institute_id>/tutor-invite/respond/",
        views.TutorRespondToInstituteInviteView.as_view(),
        name="tutor_respond_invite",
    ),
    path("<uuid:institute_id>/", views.InstitutePublicDetailView.as_view(), name="public_detail"),
    path("admin/<uuid:institute_id>/approve/", views.AdminApproveInstituteView.as_view(), name="admin_approve"),
    path("admin/<uuid:institute_id>/reject/", views.AdminRejectInstituteView.as_view(), name="admin_reject"),
]
