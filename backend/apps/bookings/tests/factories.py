import datetime

import factory
from factory.django import DjangoModelFactory

from apps.bookings.models import Booking, BookingMode, BookingStatus, BookingType, PaymentStatus
from apps.students.tests.factories import StudentProfileFactory
from apps.tutors.tests.factories import TutorProfileFactory


class BookingFactory(DjangoModelFactory):
    """
    Creates a Booking directly via the ORM (bypassing BookingService), for
    tests that exercise cancel/complete/reschedule logic on an
    already-existing booking without needing to set up tutor availability.
    """

    class Meta:
        model = Booking

    student = factory.SubFactory(StudentProfileFactory)
    tutor = factory.SubFactory(TutorProfileFactory)
    booking_type = BookingType.REGULAR
    mode = BookingMode.ONLINE
    status = BookingStatus.CONFIRMED
    payment_status = PaymentStatus.PAID
    price = 500
    start_time = factory.LazyFunction(
        lambda: datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
    )
    end_time = factory.LazyAttribute(lambda o: o.start_time + datetime.timedelta(hours=1))

    @factory.lazy_attribute
    def booked_by(self):
        return self.student.user
