import stripe
from django.conf import settings

from apps.core.exceptions import ApplicationError


class StripeGateway:
    def _configured_stripe(self):
        if not settings.STRIPE_SECRET_KEY:
            raise ApplicationError("Stripe is not configured on this server.")
        stripe.api_key = settings.STRIPE_SECRET_KEY
        return stripe

    def create_payment_intent(self, *, amount, currency: str, metadata: dict) -> dict:
        """amount is in the currency's smallest unit (cents for USD)."""
        client = self._configured_stripe()
        intent = client.PaymentIntent.create(
            amount=int(amount * 100),
            currency=currency.lower(),
            metadata=metadata,
            automatic_payment_methods={"enabled": True},
        )
        return {"id": intent.id, "client_secret": intent.client_secret, "status": intent.status}

    def construct_webhook_event(self, *, payload_body: bytes, signature: str):
        client = self._configured_stripe()
        try:
            return client.Webhook.construct_event(payload_body, signature, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            raise ApplicationError("Invalid Stripe webhook signature.") from exc

    def create_refund(self, *, gateway_payment_id: str, amount) -> dict:
        client = self._configured_stripe()
        refund = client.Refund.create(payment_intent=gateway_payment_id, amount=int(amount * 100))
        return {"id": refund.id, "status": refund.status}

    def create_subscription_checkout(self, *, customer_email: str, price_amount, currency: str, metadata: dict) -> dict:
        """
        Creates a one-off PaymentIntent representing the first billing cycle.
        Recurring billing in production would use Stripe Billing/Subscriptions
        with a pre-created Price object; kept as a PaymentIntent here so the
        flow works without requiring Stripe Dashboard product setup first.
        """
        return self.create_payment_intent(amount=price_amount, currency=currency, metadata=metadata)
