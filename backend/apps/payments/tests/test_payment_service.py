from decimal import Decimal
from unittest.mock import patch

import pytest

from apps.payments.models import PaymentPurpose, PaymentStatus
from apps.payments.services.payment_service import PaymentService
from apps.payments.tests.factories import CouponFactory
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestInitiatePayment:
    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.create_order")
    def test_initiate_wallet_topup_creates_razorpay_order(self, mock_create_order):
        mock_create_order.return_value = {"id": "order_abc123", "amount": 50000, "currency": "INR"}
        user = UserFactory()

        payment, gateway_response = PaymentService().initiate_wallet_topup(user, amount=Decimal("500"), gateway="razorpay")

        assert payment.status == PaymentStatus.PENDING
        assert payment.gateway_order_id == "order_abc123"
        assert gateway_response["requires_gateway"] is True
        mock_create_order.assert_called_once()

    def test_coupon_fully_covering_amount_skips_gateway(self):
        coupon = CouponFactory(discount_type="flat", discount_value=500)
        user = UserFactory()

        payment, gateway_response = PaymentService().initiate_payment(
            user, purpose=PaymentPurpose.WALLET_TOPUP, reference_id=user.id, amount=Decimal("500"),
            gateway="razorpay", coupon_code=coupon.code,
        )

        assert payment.status == PaymentStatus.PAID
        assert gateway_response["requires_gateway"] is False


class TestConfirmRazorpayPayment:
    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.verify_payment_signature")
    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.create_order")
    def test_confirm_credits_wallet_on_topup(self, mock_create_order, mock_verify):
        mock_create_order.return_value = {"id": "order_xyz", "amount": 100000, "currency": "INR"}
        mock_verify.return_value = True

        user = UserFactory()
        service = PaymentService()
        payment, _ = service.initiate_wallet_topup(user, amount=Decimal("1000"), gateway="razorpay")

        confirmed = service.confirm_razorpay_payment(
            payment, razorpay_payment_id="pay_123", razorpay_signature="sig_abc"
        )

        assert confirmed.status == PaymentStatus.PAID
        from apps.payments.services.wallet_service import WalletService

        assert WalletService().get_balance(user) == Decimal("1000")

    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.verify_payment_signature")
    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.create_order")
    def test_confirm_is_idempotent(self, mock_create_order, mock_verify):
        mock_create_order.return_value = {"id": "order_idem", "amount": 100000, "currency": "INR"}
        mock_verify.return_value = True

        user = UserFactory()
        service = PaymentService()
        payment, _ = service.initiate_wallet_topup(user, amount=Decimal("1000"), gateway="razorpay")

        service.confirm_razorpay_payment(payment, razorpay_payment_id="pay_1", razorpay_signature="sig_1")
        service.confirm_razorpay_payment(payment, razorpay_payment_id="pay_1", razorpay_signature="sig_1")

        from apps.payments.services.wallet_service import WalletService

        # Balance should only reflect ONE credit, not two, despite calling confirm twice.
        assert WalletService().get_balance(user) == Decimal("1000")


class TestReferralBonusOnFirstPayment:
    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.verify_payment_signature")
    @patch("apps.payments.gateways.razorpay_gateway.RazorpayGateway.create_order")
    def test_referrer_is_credited_on_referred_users_first_payment(self, mock_create_order, mock_verify):
        mock_create_order.return_value = {"id": "order_ref", "amount": 100000, "currency": "INR"}
        mock_verify.return_value = True

        referrer = UserFactory()
        referred = UserFactory(referred_by=referrer)

        service = PaymentService()
        payment, _ = service.initiate_wallet_topup(referred, amount=Decimal("1000"), gateway="razorpay")
        service.confirm_razorpay_payment(payment, razorpay_payment_id="pay_ref", razorpay_signature="sig_ref")

        from apps.payments.services.wallet_service import WalletService
        from django.conf import settings

        assert WalletService().get_balance(referrer) == Decimal(str(settings.REFERRAL_BONUS_AMOUNT))
