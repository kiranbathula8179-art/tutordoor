import random
import string

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField

from apps.core.models import BaseModel


class UserRole(models.TextChoices):
    STUDENT = "student", "Student"
    TUTOR = "tutor", "Tutor"
    PARENT = "parent", "Parent"
    INSTITUTE_ADMIN = "institute_admin", "Institute Admin"
    ADMIN = "admin", "Platform Admin"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", UserRole.STUDENT)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_email_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Central identity for every actor on the platform. Role-specific data
    (tutor profile, student profile, etc.) lives in the respective domain
    app's OneToOne "profile" model to keep this model lean (SRP).
    """

    email = models.EmailField(unique=True, db_index=True)
    phone_number = PhoneNumberField(unique=True, null=True, blank=True, db_index=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT, db_index=True)

    avatar = models.ImageField(upload_to="avatars/%Y/%m/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    signup_source = models.CharField(
        max_length=20,
        choices=[("email", "Email"), ("google", "Google"), ("admin", "Admin Created")],
        default="email",
    )

    referral_code = models.CharField(max_length=12, unique=True, db_index=True)
    referred_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="referrals"
    )

    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_active_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self._generate_referral_code()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_referral_code():
        alphabet = string.ascii_uppercase + string.digits
        while True:
            code = "".join(random.choices(alphabet, k=8))
            if not User.all_objects.filter(referral_code=code).exists():
                return code


class OTPPurpose(models.TextChoices):
    PHONE_VERIFICATION = "phone_verification", "Phone Verification"
    LOGIN = "login", "Login"
    PASSWORD_RESET = "password_reset", "Password Reset"


class OTP(BaseModel):
    """
    Server-side OTP record. The raw code is hashed before storage;
    verification re-hashes the submitted code and compares.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otps")
    destination = models.CharField(max_length=255, help_text="Phone number or email the OTP was sent to.")
    purpose = models.CharField(max_length=30, choices=OTPPurpose.choices)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)

    class Meta:
        db_table = "otps"
        indexes = [models.Index(fields=["user", "purpose", "is_used"])]

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_exhausted(self):
        return self.attempt_count >= self.max_attempts


class EmailVerificationToken(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_verification_tokens")
    token = models.CharField(max_length=128, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "email_verification_tokens"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at


class LoginAuditLog(BaseModel):
    """Immutable audit trail of authentication events, for security monitoring."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_audit_logs", null=True)
    event = models.CharField(
        max_length=30,
        choices=[
            ("login_success", "Login Success"),
            ("login_failed", "Login Failed"),
            ("logout", "Logout"),
            ("password_changed", "Password Changed"),
            ("password_reset", "Password Reset"),
            ("account_locked", "Account Locked"),
        ],
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "login_audit_logs"
        indexes = [models.Index(fields=["user", "event"])]
