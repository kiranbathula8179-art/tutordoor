from django.urls import path

from apps.analytics import views

app_name = "analytics"

urlpatterns = [
    path("admin/dashboard/", views.AdminDashboardView.as_view(), name="admin_dashboard"),
    path("admin/top-tutors/", views.AdminTopTutorsView.as_view(), name="admin_top_tutors"),
    path("admin/top-subjects/", views.AdminTopSubjectsView.as_view(), name="admin_top_subjects"),
    path("admin/revenue-report/", views.AdminRevenueReportView.as_view(), name="admin_revenue_report"),
    path("admin/metrics-trend/", views.AdminMetricsTrendView.as_view(), name="admin_metrics_trend"),
    path("tutor/dashboard/", views.TutorDashboardView.as_view(), name="tutor_dashboard"),
    path("student/dashboard/", views.StudentDashboardView.as_view(), name="student_dashboard"),
]
