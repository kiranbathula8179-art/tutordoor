from django.urls import path

from apps.reviews import views

app_name = "reviews"

urlpatterns = [
    path("tutors/<uuid:tutor_id>/", views.TutorReviewListView.as_view(), name="tutor_reviews"),
    path("bookings/<uuid:booking_id>/submit/", views.SubmitTutorReviewView.as_view(), name="submit_tutor_review"),
    path(
        "tutor-reviews/<uuid:review_id>/respond/", views.RespondToTutorReviewView.as_view(), name="respond_tutor_review"
    ),
    path("tutor-reviews/<uuid:review_id>/flag/", views.FlagTutorReviewView.as_view(), name="flag_tutor_review"),
    path("courses/<uuid:course_id>/", views.CourseReviewListView.as_view(), name="course_reviews"),
    path(
        "enrollments/<uuid:enrollment_id>/submit/", views.SubmitCourseReviewView.as_view(), name="submit_course_review"
    ),
    path(
        "course-reviews/<uuid:review_id>/respond/",
        views.RespondToCourseReviewView.as_view(),
        name="respond_course_review",
    ),
]
