import uuid

import django.contrib.auth.validators
import django.utils.timezone
import phonenumber_field.modelfields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(
                    default=False,
                    help_text="Designates that this user has all permissions without explicitly assigning them.",
                    verbose_name="superuser status",
                )),
                ("email", models.EmailField(db_index=True, max_length=254, unique=True)),
                ("phone_number", phonenumber_field.modelfields.PhoneNumberField(blank=True, db_index=True, max_length=128, null=True, region=None, unique=True)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("role", models.CharField(choices=[("student", "Student"), ("tutor", "Tutor"), ("parent", "Parent"), ("institute_admin", "Institute Admin"), ("admin", "Platform Admin")], db_index=True, default="student", max_length=20)),
                ("avatar", models.ImageField(blank=True, null=True, upload_to="avatars/%Y/%m/")),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("is_email_verified", models.BooleanField(default=False)),
                ("is_phone_verified", models.BooleanField(default=False)),
                ("google_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ("signup_source", models.CharField(choices=[("email", "Email"), ("google", "Google"), ("admin", "Admin Created")], default="email", max_length=20)),
                ("referral_code", models.CharField(db_index=True, max_length=12, unique=True)),
                ("last_login_ip", models.GenericIPAddressField(blank=True, null=True)),
                ("last_active_at", models.DateTimeField(blank=True, null=True)),
                ("groups", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("referred_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="referrals", to="users.user")),
                ("user_permissions", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={
                "verbose_name": "User",
                "verbose_name_plural": "Users",
                "db_table": "users",
            },
        ),
        migrations.CreateModel(
            name="OTP",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("destination", models.CharField(help_text="Phone number or email the OTP was sent to.", max_length=255)),
                ("purpose", models.CharField(choices=[("phone_verification", "Phone Verification"), ("login", "Login"), ("password_reset", "Password Reset")], max_length=30)),
                ("code_hash", models.CharField(max_length=128)),
                ("expires_at", models.DateTimeField()),
                ("is_used", models.BooleanField(default=False)),
                ("attempt_count", models.PositiveSmallIntegerField(default=0)),
                ("max_attempts", models.PositiveSmallIntegerField(default=5)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="otps", to="users.user")),
            ],
            options={"db_table": "otps"},
        ),
        migrations.CreateModel(
            name="EmailVerificationToken",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("token", models.CharField(db_index=True, max_length=128, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("is_used", models.BooleanField(default=False)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="email_verification_tokens", to="users.user")),
            ],
            options={"db_table": "email_verification_tokens"},
        ),
        migrations.CreateModel(
            name="LoginAuditLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("event", models.CharField(choices=[("login_success", "Login Success"), ("login_failed", "Login Failed"), ("logout", "Logout"), ("password_changed", "Password Changed"), ("password_reset", "Password Reset"), ("account_locked", "Account Locked")], max_length=30)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=512)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("user", models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name="login_audit_logs", to="users.user")),
            ],
            options={"db_table": "login_audit_logs"},
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["role", "is_active"], name="users_role_active_idx"),
        ),
        migrations.AddIndex(
            model_name="otp",
            index=models.Index(fields=["user", "purpose", "is_used"], name="otps_user_purpose_idx"),
        ),
        migrations.AddIndex(
            model_name="loginauditlog",
            index=models.Index(fields=["user", "event"], name="login_audit_user_event_idx"),
        ),
    ]
