from django.contrib import admin

from apps.reviews.models import CourseReview, TutorReview


@admin.register(TutorReview)
class TutorReviewAdmin(admin.ModelAdmin):
    list_display = ("tutor", "student", "rating", "is_flagged", "created_at")
    list_filter = ("rating", "is_flagged")
    search_fields = ("tutor__user__email", "student__user__email")


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ("course", "student", "rating", "is_flagged", "created_at")
    list_filter = ("rating", "is_flagged")
    search_fields = ("course__title", "student__user__email")
