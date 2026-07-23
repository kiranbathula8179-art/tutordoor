import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class PasswordComplexityValidator:
    """
    Enforces OWASP-recommended password complexity:
    at least one uppercase, one lowercase, one digit, one special character.
    """

    UPPER_RE = re.compile(r"[A-Z]")
    LOWER_RE = re.compile(r"[a-z]")
    DIGIT_RE = re.compile(r"\d")
    SPECIAL_RE = re.compile(r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>/?\\|`~]")

    def validate(self, password, user=None):
        errors = []
        if not self.UPPER_RE.search(password):
            errors.append(_("Password must contain at least one uppercase letter."))
        if not self.LOWER_RE.search(password):
            errors.append(_("Password must contain at least one lowercase letter."))
        if not self.DIGIT_RE.search(password):
            errors.append(_("Password must contain at least one digit."))
        if not self.SPECIAL_RE.search(password):
            errors.append(_("Password must contain at least one special character."))
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter, one "
            "lowercase letter, one digit, and one special character."
        )
