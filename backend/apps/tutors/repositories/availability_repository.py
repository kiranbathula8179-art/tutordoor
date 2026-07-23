from apps.tutors.models import AvailabilityException, WeeklyAvailability


class AvailabilityRepository:
    def list_weekly(self, tutor):
        return WeeklyAvailability.objects.filter(tutor=tutor, is_active=True).order_by("day_of_week", "start_time")

    def replace_weekly(self, tutor, slots: list[dict]):
        """slots: [{day_of_week, start_time, end_time}, ...] — full replace of the weekly template."""
        WeeklyAvailability.objects.filter(tutor=tutor).delete()
        return WeeklyAvailability.objects.bulk_create(
            [
                WeeklyAvailability(
                    tutor=tutor,
                    day_of_week=slot["day_of_week"],
                    start_time=slot["start_time"],
                    end_time=slot["end_time"],
                )
                for slot in slots
            ]
        )

    def list_exceptions_for_range(self, tutor, start_date, end_date):
        return AvailabilityException.objects.filter(tutor=tutor, date__range=(start_date, end_date))

    def list_upcoming_exceptions(self, tutor):
        from django.utils import timezone

        return AvailabilityException.objects.filter(tutor=tutor, date__gte=timezone.localdate()).order_by(
            "date", "start_time"
        )

    def add_exception(self, tutor, **fields) -> AvailabilityException:
        return AvailabilityException.objects.create(tutor=tutor, **fields)

    def delete_exception(self, tutor, exception_id) -> int:
        deleted, _ = AvailabilityException.objects.filter(tutor=tutor, id=exception_id).delete()
        return deleted
