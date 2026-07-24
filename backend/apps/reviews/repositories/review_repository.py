from typing import Optional

from apps.reviews.models import CourseReview, TutorReview


class TutorReviewRepository:
    model = TutorReview

    def create(self, **fields) -> TutorReview:
        return self.model.objects.create(**fields)

    def get_by_booking(self, booking) -> Optional[TutorReview]:
        return self.model.objects.filter(booking=booking).first()

    def get_by_id(self, review_id) -> Optional[TutorReview]:
        return self.model.objects.select_related("tutor", "student__user").filter(id=review_id).first()

    def list_for_tutor(self, tutor, include_flagged: bool = False):
        qs = self.model.objects.filter(tutor=tutor).select_related("student__user")
        if not include_flagged:
            qs = qs.filter(is_flagged=False)
        return qs.order_by("-created_at")

    def update(self, review: TutorReview, **fields) -> TutorReview:
        for key, value in fields.items():
            setattr(review, key, value)
        review.save(update_fields=list(fields.keys()) + ["updated_at"])
        return review

    def average_and_count_for_tutor(self, tutor):
        from django.db.models import Avg, Count

        result = self.model.objects.filter(tutor=tutor, is_flagged=False).aggregate(
            avg=Avg("rating"), count=Count("id")
        )
        return result["avg"] or 0, result["count"] or 0


class CourseReviewRepository:
    model = CourseReview

    def create(self, **fields) -> CourseReview:
        return self.model.objects.create(**fields)

    def get_by_enrollment(self, enrollment) -> Optional[CourseReview]:
        return self.model.objects.filter(enrollment=enrollment).first()

    def get_by_id(self, review_id) -> Optional[CourseReview]:
        return self.model.objects.select_related("course", "student__user").filter(id=review_id).first()

    def list_for_course(self, course, include_flagged: bool = False):
        qs = self.model.objects.filter(course=course).select_related("student__user")
        if not include_flagged:
            qs = qs.filter(is_flagged=False)
        return qs.order_by("-created_at")

    def update(self, review: CourseReview, **fields) -> CourseReview:
        for key, value in fields.items():
            setattr(review, key, value)
        review.save(update_fields=list(fields.keys()) + ["updated_at"])
        return review

    def average_and_count_for_course(self, course):
        from django.db.models import Avg, Count

        result = self.model.objects.filter(course=course, is_flagged=False).aggregate(
            avg=Avg("rating"), count=Count("id")
        )
        return result["avg"] or 0, result["count"] or 0
