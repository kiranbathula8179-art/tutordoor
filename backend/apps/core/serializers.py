from rest_framework import serializers


class TimeStampedSerializerMixin(serializers.Serializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class SuccessResponseSerializer(serializers.Serializer):
    """Documented wrapper shape used across drf-spectacular schemas."""

    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
