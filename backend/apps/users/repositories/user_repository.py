from typing import Optional

from apps.users.models import User


class UserRepository:
    """
    Encapsulates all persistence access for User so service layers never
    touch the ORM directly. Makes swapping storage or adding caching trivial.
    """

    model = User

    def get_by_id(self, user_id) -> Optional[User]:
        return self.model.objects.filter(id=user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.model.objects.filter(email__iexact=email).first()

    def get_by_phone(self, phone_number: str) -> Optional[User]:
        return self.model.objects.filter(phone_number=phone_number).first()

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        return self.model.objects.filter(google_id=google_id).first()

    def get_by_referral_code(self, referral_code: str) -> Optional[User]:
        return self.model.objects.filter(referral_code=referral_code.upper()).first()

    def email_exists(self, email: str) -> bool:
        return self.model.objects.filter(email__iexact=email).exists()

    def phone_exists(self, phone_number: str) -> bool:
        return self.model.objects.filter(phone_number=phone_number).exists()

    def create(self, **fields) -> User:
        password = fields.pop("password", None)
        user = self.model(**fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, user: User, **fields) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        user.save(update_fields=list(fields.keys()) + ["updated_at"])
        return user

    def set_password(self, user: User, raw_password: str) -> User:
        user.set_password(raw_password)
        user.save(update_fields=["password", "updated_at"])
        return user
