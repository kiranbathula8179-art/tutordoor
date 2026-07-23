import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger("tutordoor")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_otp_sms_task(self, phone_number: str, code: str, purpose: str):
    try:
        from twilio.rest import Client

        if not settings.TWILIO_ACCOUNT_SID:
            logger.info("Twilio not configured; OTP for %s is %s (dev mode)", phone_number, code)
            return

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f"Your TutorDoor verification code is {code}. It expires in "
            f"{settings.OTP_EXPIRY_MINUTES} minutes. Do not share this code.",
            from_=settings.TWILIO_FROM_NUMBER,
            to=phone_number,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send OTP SMS to %s", phone_number)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_otp_email_task(self, user_id: str, email: str, code: str, purpose: str):
    try:
        send_mail(
            subject="Your TutorDoor verification code",
            message=f"Your verification code is {code}. It expires in {settings.OTP_EXPIRY_MINUTES} minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send OTP email to %s", email)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_verification_email_task(self, user_id: str, email: str, verification_link: str):
    try:
        html_message = render_to_string(
            "emails/verify_email.html",
            {"verification_link": verification_link},
        )
        send_mail(
            subject="Verify your TutorDoor account",
            message=f"Verify your account: {verification_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send verification email to %s", email)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_whatsapp_message_task(self, phone_number: str, message: str):
    try:
        from twilio.rest import Client

        if not settings.TWILIO_ACCOUNT_SID:
            logger.info("Twilio not configured; WhatsApp message to %s: %s", phone_number, message)
            return

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
            to=f"whatsapp:{phone_number}",
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send WhatsApp message to %s", phone_number)
        raise self.retry(exc=exc)
