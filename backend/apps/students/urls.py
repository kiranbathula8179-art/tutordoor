from django.urls import path

from apps.students import views

app_name = "students"

urlpatterns = [
    path("me/profile/", views.MyStudentProfileView.as_view(), name="my_profile"),
]
