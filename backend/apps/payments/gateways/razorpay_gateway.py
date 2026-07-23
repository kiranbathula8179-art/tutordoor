import hashlib
import hmac

import razorpay
from django.conf import settings

from apps.core.exceptions import ApplicationError


class RazorpayGateway:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not settings.RAZORPAY_KEY_ID:
                raise ApplicationError("Razorpay is not configured on this server.")
            self._client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        return self._client

    def create_order(self, *, amount, currency: str, receipt: str) -> dict:
        """amount is in the currency's smallest unit (paise for INR)."""
        return self.client.order.create(
            {
                "amount": int(amount * 100),
                "currency": currency,
                "receipt": receipt,
                "payment_capture": 1,
            }
        )

    def verify_payment_signature(self, *, order_id: str, payment_id: str, signature: str) -> bool:
        try:
            self.client.utility.verify_payment_signature(
                {"razorpay_order_id": order_id, "razorpay_payment_id": payment_id, "razorpay_signature": signature}
            )
            return True
        except razorpay.errors.SignatureVerificationError:
            return False

    def verify_webhook_signature(self, *, payload_body: bytes, signature: str) -> bool:
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), payload_body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    def create_refund(self, *, gateway_payment_id: str, amount) -> dict:
        return self.client.payment.refund(gateway_payment_id, {"amount": int(amount * 100)})
