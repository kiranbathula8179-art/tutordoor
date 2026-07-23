from django.urls import path

from apps.parents import views

app_name = "parents"

urlpatterns = [
    path("me/profile/", views.MyParentProfileView.as_view(), name="my_profile"),
    path("me/children/", views.MyChildrenView.as_view(), name="my_children"),
    path("me/children/<uuid:student_id>/enrollments/", views.ChildEnrollmentsView.as_view(), name="child_enrollments"),
    path("link/confirm/", views.ConfirmParentLinkView.as_view(), name="confirm_link"),
]
