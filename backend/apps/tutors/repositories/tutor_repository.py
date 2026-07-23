from typing import Optional

from django.db.models import QuerySet

from apps.tutors.models import Subject, SubjectCategory, TutorProfile, TutorSubject


class TutorProfileRepository:
    model = TutorProfile

    def get_by_user(self, user) -> Optional[TutorProfile]:
        return self.model.objects.filter(user=user).select_related("user").first()

    def get_by_id(self, tutor_id) -> Optional[TutorProfile]:
        return self.model.objects.filter(id=tutor_id).select_related("user").first()

    def create(self, user, **fields) -> TutorProfile:
        return self.model.objects.create(user=user, **fields)

    def update(self, profile: TutorProfile, **fields) -> TutorProfile:
        for key, value in fields.items():
            setattr(profile, key, value)
        profile.save(update_fields=list(fields.keys()) + ["updated_at"])
        return profile

    def base_queryset(self) -> QuerySet:
        return self.model.objects.select_related("user").prefetch_related("tutor_subjects__subject")

    def set_subjects(self, profile: TutorProfile, subject_entries: list[dict]) -> None:
        """subject_entries: [{subject_id, expertise_level, years_experience}, ...]"""
        TutorSubject.objects.filter(tutor=profile).delete()
        TutorSubject.objects.bulk_create(
            [
                TutorSubject(
                    tutor=profile,
                    subject_id=entry["subject_id"],
                    expertise_level=entry.get("expertise_level", "all_levels"),
                    years_experience=entry.get("years_experience", 0),
                )
                for entry in subject_entries
            ]
        )

    def update_rating(self, profile: TutorProfile, new_average, new_count: int) -> None:
        profile.rating_average = new_average
        profile.rating_count = new_count
        profile.save(update_fields=["rating_average", "rating_count", "updated_at"])


class SubjectRepository:
    def list_categories(self):
        return SubjectCategory.objects.all().order_by("display_order", "name")

    def list_subjects(self, category_id=None, is_active=True):
        qs = Subject.objects.select_related("category")
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def get_subject(self, subject_id):
        return Subject.objects.filter(id=subject_id).first()
