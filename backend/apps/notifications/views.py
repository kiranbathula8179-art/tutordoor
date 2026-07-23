from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.notifications.repositories.notification_repository import NotificationPreferenceRepository
from apps.notifications.serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    RegisterDeviceSerializer,
    UpdatePreferenceSerializer,
)
from apps.notifications.services.notification_service import NotificationService
from apps.notifications.services.push_service import PushService


class MyNotificationsView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        unread_only = request.query_params.get("unread") == "true"
        notifications = NotificationService().list_for_user(request.user, unread_only=unread_only)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(notifications, request)
        return paginator.get_paginated_response(NotificationSerializer(page, many=True).data)


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"success": True, "unread_count": NotificationService().unread_count(request.user)})


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        service = NotificationService()
        notification = service.notification_repository.get_by_id(notification_id)
        if not notification or notification.recipient_id != request.user.id:
            raise ResourceNotFoundError("Notification not found.")

        updated = service.mark_read(notification)
        return Response({"success": True, "notification": NotificationSerializer(updated).data})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = NotificationService().mark_all_read(request.user)
        return Response({"success": True, "marked_read": count})


class NotificationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        preference = NotificationPreferenceRepository().get_or_create(request.user)
        return Response({"success": True, "preference": NotificationPreferenceSerializer(preference).data})

    def patch(self, request):
        serializer = UpdatePreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        repository = NotificationPreferenceRepository()
        preference = repository.get_or_create(request.user)
        updated = repository.update(preference, **serializer.validated_data)
        return Response({"success": True, "preference": NotificationPreferenceSerializer(updated).data})


class RegisterDeviceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegisterDeviceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        PushService().register_device(request.user, **serializer.validated_data)
        return Response({"success": True, "message": "Device registered for push notifications."})
