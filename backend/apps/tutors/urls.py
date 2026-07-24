from django.urls import path

from apps.tutors import views

app_name = "tutors"

urlpatterns = [
    path("subjects/categories/", views.SubjectCategoryListView.as_view(), name="subject_categories"),
    path("subjects/", views.SubjectListView.as_view(), name="subjects"),
    path("search/", views.TutorSearchView.as_view(), name="search"),
    path("me/profile/", views.MyTutorProfileView.as_view(), name="my_profile"),
    path("me/documents/", views.VerificationDocumentListCreateView.as_view(), name="my_documents"),
    path("me/availability/weekly/", views.MyWeeklyAvailabilityView.as_view(), name="my_weekly_availability"),
    path(
        "me/availability/exceptions/", views.MyAvailabilityExceptionsView.as_view(), name="my_availability_exceptions"
    ),
    path(
        "me/availability/exceptions/<uuid:exception_id>/",
        views.MyAvailabilityExceptionsView.as_view(),
        name="my_availability_exception_detail",
    ),
    path("<uuid:tutor_id>/", views.TutorPublicDetailView.as_view(), name="public_detail"),
    path("<uuid:tutor_id>/available-slots/", views.TutorAvailableSlotsView.as_view(), name="available_slots"),
    path("admin/verifications/pending/", views.AdminPendingVerificationsView.as_view(), name="admin_pending"),
    path(
        "admin/verifications/documents/<uuid:document_id>/review/",
        views.AdminReviewDocumentView.as_view(),
        name="admin_review_document",
    ),
    path("admin/verifications/<uuid:tutor_id>/approve/", views.AdminApproveTutorView.as_view(), name="admin_approve"),
    path("admin/verifications/<uuid:tutor_id>/reject/", views.AdminRejectTutorView.as_view(), name="admin_reject"),
]
