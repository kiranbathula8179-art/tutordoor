from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import LOGGING, env

DEBUG = False

# ---------------------------------------------------------------------------
# Secret hardening (production-readiness audit, finding HIGH-2).
#
# base.py provides a development fallback for DJANGO_SECRET_KEY. That key also
# signs JWTs (SIMPLE_JWT["SIGNING_KEY"] = SECRET_KEY), so booting production
# with the fallback would let anyone forge a token for any user, including
# admins. Fail loudly at import time instead of starting insecurely.
# ---------------------------------------------------------------------------
UNSAFE_SECRET_DEFAULT = "unsafe-dev-key-change-me"  # noqa: S105 - sentinel, not a credential

SECRET_KEY = env.str("DJANGO_SECRET_KEY", default="")

if not SECRET_KEY or SECRET_KEY == UNSAFE_SECRET_DEFAULT:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set to a unique, secret value in production. "
        "It signs session cookies AND JWT access tokens; the development "
        "fallback would allow token forgery. Generate one with: "
        "python -c \"from django.core.management.utils import get_random_secret_key; "
        "print(get_random_secret_key())\""
    )

# Keep JWT signing consistent with the validated production key.
SIMPLE_JWT["SIGNING_KEY"] = SECRET_KEY  # noqa: F405

# Application logs at INFO in production (audit finding LOW-2): DEBUG-level
# logging is noisy at scale and risks writing request/user detail to stdout.
LOGGING["loggers"]["tutordoor"]["level"] = "INFO"

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SENTRY_DSN = env.str("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
        environment="production",
    )

DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
AWS_STORAGE_BUCKET_NAME = env.str("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = env.str("AWS_S3_REGION_NAME", default="ap-south-1")
AWS_ACCESS_KEY_ID = env.str("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env.str("AWS_SECRET_ACCESS_KEY", default="")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
