import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.users.models import User

logger = logging.getLogger("tutordoor")


@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    if created:
        logger.info("New user registered: %s (role=%s)", instance.email, instance.role)
