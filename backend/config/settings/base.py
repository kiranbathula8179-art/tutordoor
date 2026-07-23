"""
Base settings for TutorDoor.
Split-settings pattern: base.py -> dev.py / production.py
"""
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(str(BASE_DIR / ".env"))

SECRET_KEY = env.str("DJANGO_SECRET_KEY", default="unsafe-dev-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# --------------------------------------------------------------------------
# Applications
# --------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "phonenumber_field",
    "django_celery_beat",
    "django_celery_results",
    "social_django",
    "django_otp",
    "django_otp.plugins.otp_totp",
    "channels",
    "django_extensions",
    "django.contrib.postgres",
]

LOCAL_APPS = [
    "apps.core",
    "apps.users",
    "apps.tutors",
    "apps.students",
    "apps.parents",
    "apps.institutes",
    "apps.bookings",
    "apps.courses",
    "apps.payments",
    "apps.notifications",
    "apps.reviews",
    "apps.chat",
    "apps.analytics",
    "apps.masterdata",
    "apps.rbac",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

SITE_ID = 1

# --------------------------------------------------------------------------
# Middleware
# --------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django_otp.middleware.OTPMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RequestLoggingMiddleware",
    "apps.core.middleware.ExceptionLoggingMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# --------------------------------------------------------------------------
# Templates
# --------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "social_django.context_processors.backends",
                "social_django.context_processors.login_redirect",
            ],
        },
    },
]

# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"postgres://{env.str('POSTGRES_USER', 'tutordoor')}:"
        f"{env.str('POSTGRES_PASSWORD', 'tutordoor')}@"
        f"{env.str('POSTGRES_HOST', 'localhost')}:"
        f"{env.str('POSTGRES_PORT', '5432')}/"
        f"{env.str('POSTGRES_DB', 'tutordoor')}",
    )
}
DATABASES["default"]["ATOMIC_REQUESTS"] = True
DATABASES["default"]["CONN_MAX_AGE"] = 60

# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------
AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "social_core.backends.google.GoogleOAuth2",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "apps.core.validators.PasswordComplexityValidator"},
]

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env.str("GOOGLE_OAUTH_CLIENT_ID", default="")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env.str("GOOGLE_OAUTH_CLIENT_SECRET", default="")

# --------------------------------------------------------------------------
# DRF / JWT / API docs
# --------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "otp_request": "5/hour",
        "login": "10/min",
        "register": "10/hour",
        "password_reset": "5/hour",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "TutorDoor API",
    "DESCRIPTION": "Production API for the TutorDoor tutoring marketplace platform.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# --------------------------------------------------------------------------
# CORS / CSRF
# --------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"])
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:5173"])

# --------------------------------------------------------------------------
# Internationalization
# --------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = env.str("DJANGO_TIME_ZONE", default="Asia/Kolkata")
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------------------
# Static & media
# --------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --------------------------------------------------------------------------
# Cache / Celery / Channels (Redis-backed)
# --------------------------------------------------------------------------
REDIS_URL = env.str("REDIS_URL", default="redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = "django-db"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [REDIS_URL]},
    }
}

# --------------------------------------------------------------------------
# Email
# --------------------------------------------------------------------------
EMAIL_BACKEND = env.str("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env.str("EMAIL_HOST", default="smtp.sendgrid.net")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env.str("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env.str("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env.str("DEFAULT_FROM_EMAIL", default="TutorDoor <no-reply@tutordoor.com>")

# --------------------------------------------------------------------------
# Third-party integrations
# --------------------------------------------------------------------------
RAZORPAY_KEY_ID = env.str("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = env.str("RAZORPAY_KEY_SECRET", default="")
STRIPE_PUBLIC_KEY = env.str("STRIPE_PUBLIC_KEY", default="")
STRIPE_SECRET_KEY = env.str("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env.str("STRIPE_WEBHOOK_SECRET", default="")

TWILIO_ACCOUNT_SID = env.str("TWILIO_ACCOUNT_SID", default="")
TWILIO_AUTH_TOKEN = env.str("TWILIO_AUTH_TOKEN", default="")
TWILIO_FROM_NUMBER = env.str("TWILIO_FROM_NUMBER", default="")
TWILIO_WHATSAPP_FROM = env.str("TWILIO_WHATSAPP_FROM", default="")

GOOGLE_MAPS_API_KEY = env.str("GOOGLE_MAPS_API_KEY", default="")

FCM_SERVER_KEY = env.str("FCM_SERVER_KEY", default="")

FRONTEND_URL = env.str("FRONTEND_URL", default="http://localhost:5173")

# --------------------------------------------------------------------------
# Security headers (tightened further in production.py)
# --------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {module}:{lineno} - {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "tutordoor": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}

# --------------------------------------------------------------------------
# Custom app settings
# --------------------------------------------------------------------------
OTP_EXPIRY_MINUTES = env.int("OTP_EXPIRY_MINUTES", default=10)
OTP_LENGTH = env.int("OTP_LENGTH", default=6)
EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = env.int("EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS", default=48)
PLATFORM_COMMISSION_PERCENT = env.float("PLATFORM_COMMISSION_PERCENT", default=15.0)
REFERRAL_BONUS_AMOUNT = env.float("REFERRAL_BONUS_AMOUNT", default=200.0)

# --------------------------------------------------------------------------
# Bookings & live classes
# --------------------------------------------------------------------------
MIN_CANCELLATION_NOTICE_HOURS = env.int("MIN_CANCELLATION_NOTICE_HOURS", default=12)
MAX_DEMO_BOOKINGS_PER_TUTOR = env.int("MAX_DEMO_BOOKINGS_PER_TUTOR", default=1)
JITSI_DOMAIN = env.str("JITSI_DOMAIN", default="meet.jit.si")

CELERY_BEAT_SCHEDULE = {
    "auto-complete-past-bookings": {
        "task": "apps.bookings.tasks.auto_complete_past_bookings_task",
        "schedule": 300.0,  # every 5 minutes
    },
    "send-upcoming-booking-reminders": {
        "task": "apps.bookings.tasks.send_upcoming_booking_reminders_task",
        "schedule": 300.0,
    },
    "expire-stale-pending-payment-bookings": {
        "task": "apps.bookings.tasks.expire_stale_pending_payment_bookings_task",
        "schedule": 600.0,  # every 10 minutes
    },
    "auto-complete-past-course-sessions": {
        "task": "apps.courses.tasks.auto_complete_past_course_sessions_task",
        "schedule": 300.0,
    },
    "expire-due-subscriptions": {
        "task": "apps.payments.tasks.expire_due_subscriptions_task",
        "schedule": 3600.0,  # hourly
    },
    "snapshot-daily-platform-metrics": {
        "task": "apps.analytics.tasks.snapshot_daily_metrics_task",
        "schedule": 86400.0,  # daily
    },
}
