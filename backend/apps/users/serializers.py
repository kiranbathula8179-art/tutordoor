from django.contrib.auth.password_validation import validate_password
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from apps.users.models import User, UserRole


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "role",
            "avatar",
            "is_email_verified",
            "is_phone_verified",
            "referral_code",
            "created_at",
        )
        read_only_fields = fields


REGISTERABLE_ROLES = (UserRole.STUDENT, UserRole.TUTOR, UserRole.PARENT, UserRole.INSTITUTE_ADMIN)


class AdminUserSerializer(UserSerializer):
    """User row for the admin directory — adds account-status fields."""

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("is_active", "last_login")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone_number = PhoneNumberField(required=False, allow_null=True)
    role = serializers.ChoiceField(choices=[(r.value, r.label) for r in REGISTERABLE_ROLES])
    referral_code = serializers.CharField(required=False, allow_blank=True, max_length=12)

    def validate_password(self, value):
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class AuthResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    tokens = TokenPairSerializer()


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    role = serializers.ChoiceField(
        choices=[(r.value, r.label) for r in REGISTERABLE_ROLES], required=False, default=UserRole.STUDENT
    )


class RequestOTPSerializer(serializers.Serializer):
    purpose = serializers.ChoiceField(choices=["phone_verification", "login"])


class VerifyPhoneSerializer(serializers.Serializer):
    code = serializers.CharField(min_length=4, max_length=8)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=4, max_length=8)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class EmailVerificationConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
