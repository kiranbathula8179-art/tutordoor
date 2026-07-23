from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from apps.core.exceptions import ApplicationError
from apps.users.models import UserRole
from apps.users.repositories.user_repository import UserRepository


class GoogleAuthService:
    """
    Verifies a Google Sign-In ID token (received from the frontend's
    Google Identity Services widget) and finds-or-creates the local user.
    """

    def __init__(self, user_repository: UserRepository = None):
        self.user_repository = user_repository or UserRepository()

    def _verify_token(self, id_token_str: str) -> dict:
        try:
            payload = id_token.verify_oauth2_token(
                id_token_str, google_requests.Request(), settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
            )
        except ValueError as exc:
            raise ApplicationError("Invalid Google ID token.") from exc

        if payload.get("aud") != settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
            raise ApplicationError("Google token audience mismatch.")
        if not payload.get("email_verified", False):
            raise ApplicationError("Google account email is not verified.")

        return payload

    def authenticate(self, id_token_str: str, requested_role: str = UserRole.STUDENT):
        payload = self._verify_token(id_token_str)

        google_id = payload["sub"]
        email = payload["email"]

        user = self.user_repository.get_by_google_id(google_id)
        if user:
            return user, False

        user = self.user_repository.get_by_email(email)
        if user:
            self.user_repository.update(user, google_id=google_id)
            return user, False

        user = self.user_repository.create(
            email=email,
            first_name=payload.get("given_name", ""),
            last_name=payload.get("family_name", ""),
            google_id=google_id,
            role=requested_role,
            signup_source="google",
            is_email_verified=True,
        )
        return user, True
