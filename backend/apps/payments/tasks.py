import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("tutordoor")


@shared_task
def expire_due_subscriptions_task():
    from apps.payments.services.subscription_service import SubscriptionService

    count = SubscriptionService().expire_due_subscriptions()
    if count:
        logger.info("Expired/cancelled %d subscriptions.", count)
    return count


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_payment_receipt_task(self, payment_id: str):
    from apps.payments.repositories.payment_repository import PaymentRepository

    payment = PaymentRepository().get_by_id(payment_id)
    if not payment or payment.status != "paid":
        return

    try:
        send_mail(
            subject="Your TutorDoor payment receipt",
            message=(
                f"Payment received: {payment.net_payable} {payment.currency} for {payment.get_purpose_display()}.\n"
                f"Payment ID: {payment.id}\nGateway reference: {payment.gateway_payment_id}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[payment.user.email],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send payment receipt for payment %s", payment_id)
        raise self.retry(exc=exc)
