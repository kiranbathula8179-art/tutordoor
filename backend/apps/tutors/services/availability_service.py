from datetime import datetime, timedelta

from apps.core.exceptions import ApplicationError
from apps.tutors.repositories.availability_repository import AvailabilityRepository


class AvailabilityService:
    def __init__(self, availability_repository: AvailabilityRepository = None):
        self.availability_repository = availability_repository or AvailabilityRepository()

    def set_weekly_template(self, tutor, slots: list[dict]):
        for slot in slots:
            if slot["end_time"] <= slot["start_time"]:
                raise ApplicationError("Each availability slot's end time must be after its start time.")
        return self.availability_repository.replace_weekly(tutor, slots)

    def get_weekly_template(self, tutor):
        return self.availability_repository.list_weekly(tutor)

    def list_exceptions(self, tutor):
        return self.availability_repository.list_upcoming_exceptions(tutor)

    def add_exception(self, tutor, *, date, is_available: bool, start_time=None, end_time=None, reason: str = ""):
        if is_available and (start_time is None or end_time is None):
            raise ApplicationError("start_time and end_time are required for an added availability slot.")
        return self.availability_repository.add_exception(
            tutor, date=date, is_available=is_available, start_time=start_time, end_time=end_time, reason=reason
        )

    def remove_exception(self, tutor, exception_id):
        deleted = self.availability_repository.delete_exception(tutor, exception_id)
        if not deleted:
            raise ApplicationError("Availability exception not found.")
        return deleted

    def get_available_slots(self, tutor, start_date, end_date, slot_duration_minutes: int = 60):
        """
        Computes bookable time windows between start_date and end_date by
        combining the tutor's recurring weekly template with one-off
        exceptions (blocked days or extra slots). Does NOT yet exclude
        slots already reserved by a booking — the bookings app subtracts
        those at booking-creation time to avoid a circular dependency here.
        """
        weekly = list(self.availability_repository.list_weekly(tutor))
        exceptions = list(self.availability_repository.list_exceptions_for_range(tutor, start_date, end_date))
        blocked_dates = {exc.date for exc in exceptions if not exc.is_available}
        extra_slots = [exc for exc in exceptions if exc.is_available]

        weekly_by_day = {}
        for slot in weekly:
            weekly_by_day.setdefault(slot.day_of_week, []).append(slot)

        results = []
        current = start_date
        while current <= end_date:
            if current not in blocked_dates:
                for slot in weekly_by_day.get(current.weekday(), []):
                    results.extend(
                        self._split_into_chunks(current, slot.start_time, slot.end_time, slot_duration_minutes)
                    )
            for extra in extra_slots:
                if extra.date == current:
                    results.extend(
                        self._split_into_chunks(current, extra.start_time, extra.end_time, slot_duration_minutes)
                    )
            current += timedelta(days=1)

        return sorted(results, key=lambda window: window[0])

    @staticmethod
    def _split_into_chunks(date, start_time, end_time, duration_minutes):
        chunks = []
        cursor = datetime.combine(date, start_time)
        end = datetime.combine(date, end_time)
        step = timedelta(minutes=duration_minutes)
        while cursor + step <= end:
            chunks.append((cursor, cursor + step))
            cursor += step
        return chunks

    def is_within_available_window(self, tutor, start_dt, end_dt) -> bool:
        """
        Checks whether [start_dt, end_dt) (same calendar date) falls fully
        inside one of the tutor's open windows for that date — i.e. within
        a weekly-template slot (and not on a blocked exception date), or
        within a one-off extra availability slot. Used by the bookings app
        to validate a requested booking time before checking for
        double-booking conflicts.
        """
        if start_dt.date() != end_dt.date():
            return False

        date = start_dt.date()
        exceptions = list(self.availability_repository.list_exceptions_for_range(tutor, date, date))
        if any(not exc.is_available for exc in exceptions if exc.date == date):
            return False

        candidate_windows = [
            (exc.start_time, exc.end_time) for exc in exceptions if exc.is_available and exc.date == date
        ]
        candidate_windows += [
            (slot.start_time, slot.end_time)
            for slot in self.availability_repository.list_weekly(tutor)
            if slot.day_of_week == date.weekday()
        ]

        return any(
            window_start <= start_dt.time() and end_dt.time() <= window_end
            for window_start, window_end in candidate_windows
        )
