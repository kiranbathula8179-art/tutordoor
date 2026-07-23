from typing import Optional

from django.db.models import Q
from django.utils import timezone

from apps.bookings.models import ACTIVE_BOOKING_STATUSES, Booking, BookingStatusHistory


class BookingRepository:
    model = Booking

    def get_by_id(self, booking_id) -> Optional[Booking]:
        return self.model.objects.select_related("student__user", "tutor__user", "subject").filter(id=booking_id).first()

    def create(self, **fields) -> Booking:
        return self.model.objects.create(**fields)

    def update(self, booking: Booking, **fields) -> Booking:
        for key, value in fields.items():
            setattr(booking, key, value)
        booking.save(update_fields=list(fields.keys()) + ["updated_at"])
        return booking

    def record_status_change(self, booking: Booking, *, from_status: str, to_status: str, changed_by=None, reason: str = ""):
        return BookingStatusHistory.objects.create(
            booking=booking, from_status=from_status, to_status=to_status, changed_by=changed_by, reason=reason
        )

    def has_overlapping_active_booking(self, tutor, start_time, end_time, exclude_booking_id=None) -> bool:
        qs = self.model.objects.filter(
            tutor=tutor,
            status__in=ACTIVE_BOOKING_STATUSES,
            start_time__lt=end_time,
            end_time__gt=start_time,
        )
        if exclude_booking_id:
            qs = qs.exclude(id=exclude_booking_id)
        return qs.exists()

    def count_demo_bookings(self, student, tutor) -> int:
        return self.model.objects.filter(
            student=student, tutor=tutor, booking_type="demo"
        ).exclude(status="cancelled").count()

    def list_for_student(self, student, status=None, upcoming_only=False):
        qs = self.model.objects.filter(student=student).select_related("tutor__user", "subject")
        if status:
            qs = qs.filter(status=status)
        if upcoming_only:
            qs = qs.filter(start_time__gte=timezone.now())
        return qs.order_by("start_time")

    def list_for_parent(self, parent_profile, status=None, upcoming_only=False):
        """Bookings for every child actively linked to this parent."""
        from apps.parents.models import LinkStatus, ParentStudentLink

        student_ids = ParentStudentLink.objects.filter(
            parent=parent_profile, status=LinkStatus.ACTIVE
        ).values_list("student_id", flat=True)

        qs = self.model.objects.filter(student_id__in=student_ids).select_related(
            "tutor__user", "student__user", "subject"
        )
        if status:
            qs = qs.filter(status=status)
        if upcoming_only:
            qs = qs.filter(start_time__gte=timezone.now())
        return qs.order_by("start_time")

    def list_for_tutor(self, tutor, status=None, upcoming_only=False):
        qs = self.model.objects.filter(tutor=tutor).select_related("student__user", "subject")
        if status:
            qs = qs.filter(status=status)
        if upcoming_only:
            qs = qs.filter(start_time__gte=timezone.now())
        return qs.order_by("start_time")

    def list_due_for_auto_complete(self):
        return self.model.objects.filter(
            status__in=["confirmed", "in_progress"], end_time__lt=timezone.now()
        )

    def list_upcoming_within(self, minutes_from, minutes_to):
        now = timezone.now()
        window_start = now + timezone.timedelta(minutes=minutes_from)
        window_end = now + timezone.timedelta(minutes=minutes_to)
        return self.model.objects.filter(
            status="confirmed", start_time__gte=window_start, start_time__lte=window_end
        ).select_related("student__user", "tutor__user")

    def list_stale_pending_payment(self, older_than_minutes: int):
        cutoff = timezone.now() - timezone.timedelta(minutes=older_than_minutes)
        return self.model.objects.filter(status="pending_payment", created_at__lt=cutoff)
