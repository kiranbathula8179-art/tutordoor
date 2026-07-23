import logging

import requests
from django.conf import settings

from apps.notifications.repositories.notification_repository import DeviceTokenRepository

logger = logging.getLogger("tutordoor")


class PushService:
    """
    Sends push notifications via Firebase Cloud Messaging.

    NOTE: this uses FCM's legacy HTTP API (server key + `Authorization: key=`)
    for simplicity, since it needs no OAuth2/service-account setup to get a
    demo working end-to-end. Google's newer HTTP v1 API (service-account
    OAuth2 tokens) is recommended for new production integrations — swapping
    is isolated to the `_send_single` method below.
    """

    FCM_LEGACY_URL = "https://fcm.googleapis.com/fcm/send"

    def __init__(self, device_token_repository: DeviceTokenRepository = None):
        self.device_token_repository = device_token_repository or DeviceTokenRepository()

    def register_device(self, user, *, token: str, platform: str):
        return self.device_token_repository.register(user, token=token, platform=platform)

    def send_to_user(self, user, *, title: str, body: str, data: dict = None) -> list[dict]:
        tokens = self.device_token_repository.list_active_for_user(user)
        results = []
        for device in tokens:
            result = self._send_single(device.token, title=title, body=body, data=data or {})
            if not result.get("success"):
                self.device_token_repository.deactivate(device.token)
            results.append(result)
        return results

    def _send_single(self, token: str, *, title: str, body: str, data: dict) -> dict:
        if not settings.FCM_SERVER_KEY:
            logger.info("FCM not configured; would push '%s' to token %s...", title, token[:12])
            return {"success": True, "simulated": True}

        try:
            response = requests.post(
                self.FCM_LEGACY_URL,
                headers={
                    "Authorization": f"key={settings.FCM_SERVER_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "to": token,
                    "notification": {"title": title, "body": body},
                    "data": data,
                },
                timeout=10,
            )
            payload = response.json()
            success = payload.get("success", 0) >= 1
            return {"success": success, "response": payload}
        except requests.RequestException as exc:
            logger.exception("FCM push failed for token %s...", token[:12])
            return {"success": False, "error": str(exc)}
