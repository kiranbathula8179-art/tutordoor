from decimal import Decimal

import pytest

from apps.bookings.models import PaymentStatus as BookingPaymentStatus
from apps.bookings.tests.factories import BookingFactory
from apps.payments.services.payout_service import PayoutService
from apps.payments.services.wallet_service import WalletService

pytestmark = pytest.mark.django_db


class TestPayoutService:
    def test_tutor_receives_price_minus_platform_commission(self, settings):
        settings.PLATFORM_COMMISSION_PERCENT = 15.0
        booking = BookingFactory(price=Decimal("1000.00"), payment_status=BookingPaymentStatus.PAID)

        PayoutService().credit_tutor_for_booking(booking)

        balance = WalletService().get_balance(booking.tutor.user)
        assert balance == Decimal("850.00")

    def test_unpaid_booking_is_not_paid_out(self):
        booking = BookingFactory(price=Decimal("1000.00"), payment_status=BookingPaymentStatus.PENDING)

        result = PayoutService().credit_tutor_for_booking(booking)

        assert result is None
        assert WalletService().get_balance(booking.tutor.user) == Decimal("0")

    def test_free_demo_booking_is_not_paid_out(self):
        booking = BookingFactory(price=Decimal("0.00"), payment_status=BookingPaymentStatus.NOT_REQUIRED)

        result = PayoutService().credit_tutor_for_booking(booking)
        assert result is None
