from django.urls import path

from apps.bookings import views

app_name = "bookings"

urlpatterns = [
    path("admin/bookings/", views.AdminBookingListView.as_view(), name="admin_bookings"),
    path("", views.CreateBookingView.as_view(), name="create"),
    path("me/", views.MyBookingsView.as_view(), name="my_bookings"),
    path("<uuid:booking_id>/", views.BookingDetailView.as_view(), name="detail"),
    path("<uuid:booking_id>/cancel/", views.CancelBookingView.as_view(), name="cancel"),
    path("<uuid:booking_id>/complete/", views.CompleteBookingView.as_view(), name="complete"),
    path("<uuid:booking_id>/no-show/", views.MarkNoShowView.as_view(), name="no_show"),
    path("<uuid:booking_id>/tutor-notes/", views.UpdateTutorNotesView.as_view(), name="tutor_notes"),
    path("<uuid:booking_id>/reschedule/", views.RescheduleRequestCreateView.as_view(), name="reschedule_create"),
    path("<uuid:booking_id>/reschedule/pending/", views.PendingReschedulesView.as_view(), name="reschedule_pending"),
    path(
        "reschedule/<uuid:request_id>/respond/",
        views.RescheduleRequestRespondView.as_view(),
        name="reschedule_respond",
    ),
    path("<uuid:booking_id>/live-class/join/", views.LiveClassJoinView.as_view(), name="live_class_join"),
    path("<uuid:booking_id>/live-class/leave/", views.LiveClassLeaveView.as_view(), name="live_class_leave"),
    path(
        "<uuid:booking_id>/live-class/attendance/", views.SessionAttendanceView.as_view(), name="live_class_attendance"
    ),
]
