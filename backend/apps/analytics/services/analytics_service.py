from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.analytics.repositories.metrics_repository import MetricsRepository


class AdminAnalyticsService:
    def get_dashboard_summary(self):
        from apps.bookings.models import Booking
        from apps.payments.models import Payment, UserSubscription
        from apps.tutors.models import TutorProfile, VerificationStatus
        from apps.users.models import User, UserRole

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        users_by_role = dict(User.objects.values_list("role").annotate(count=Count("id")).order_by())
        bookings_by_status = dict(Booking.objects.values_list("status").annotate(count=Count("id")).order_by())

        revenue_this_month = Payment.objects.filter(status="paid", paid_at__gte=month_start).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0")

        return {
            "total_users": User.objects.count(),
            "users_by_role": users_by_role,
            "new_signups_this_month": User.objects.filter(created_at__gte=month_start).count(),
            "pending_tutor_verifications": TutorProfile.objects.filter(verification_status=VerificationStatus.PENDING).count(),
            "bookings_by_status": bookings_by_status,
            "revenue_this_month": revenue_this_month,
            "active_subscriptions": UserSubscription.objects.filter(status="active").count(),
        }

    def get_top_tutors(self, limit: int = 10):
        from apps.tutors.models import TutorProfile

        return TutorProfile.objects.filter(verification_status="verified").order_by(
            "-rating_average", "-total_sessions_completed"
        )[:limit]

    def get_top_subjects(self, limit: int = 10):
        from apps.bookings.models import Booking

        return (
            Booking.objects.exclude(subject__isnull=True)
            .values("subject__name")
            .annotate(booking_count=Count("id"))
            .order_by("-booking_count")[:limit]
        )

    def get_revenue_report(self, start_date, end_date):
        from apps.payments.models import Payment

        return (
            Payment.objects.filter(status="paid", paid_at__date__range=(start_date, end_date))
            .values("purpose")
            .annotate(total_amount=Sum("amount"), transaction_count=Count("id"))
            .order_by("purpose")
        )


class TutorAnalyticsService:
    def get_dashboard_summary(self, tutor_profile):
        from apps.bookings.models import Booking
        from apps.payments.models import WalletTransaction
        from apps.payments.repositories.wallet_repository import WalletRepository

        now = timezone.now()
        upcoming_count = Booking.objects.filter(
            tutor=tutor_profile, status="confirmed", start_time__gte=now
        ).count()

        wallet = WalletRepository().get_or_create(tutor_profile.user)
        total_earnings = WalletTransaction.objects.filter(
            wallet=wallet, category__in=["booking_payout", "course_payout"]
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        booking_stats = Booking.objects.filter(tutor=tutor_profile).aggregate(
            total=Count("id"),
            completed=Count("id", filter=Q(status="completed")),
            cancelled=Count("id", filter=Q(status="cancelled")),
        )
        completion_rate = (
            round(booking_stats["completed"] / booking_stats["total"] * 100, 1) if booking_stats["total"] else 0
        )

        return {
            "upcoming_sessions": upcoming_count,
            "total_earnings": total_earnings,
            "wallet_balance": wallet.balance,
            "rating_average": tutor_profile.rating_average,
            "rating_count": tutor_profile.rating_count,
            "total_sessions_completed": tutor_profile.total_sessions_completed,
            "completion_rate_percent": completion_rate,
        }


class StudentAnalyticsService:
    def get_dashboard_summary(self, student_profile):
        from apps.bookings.models import Booking
        from apps.courses.models import CourseEnrollment

        now = timezone.now()
        upcoming_count = Booking.objects.filter(
            student=student_profile, status="confirmed", start_time__gte=now
        ).count()

        active_enrollments = CourseEnrollment.objects.filter(student=student_profile, status="active").count()

        return {
            "upcoming_sessions": upcoming_count,
            "total_sessions_completed": student_profile.total_sessions_completed,
            "total_hours_learned": student_profile.total_hours_learned,
            "active_course_enrollments": active_enrollments,
        }


class MetricsSnapshotService:
    def __init__(self, metrics_repository: MetricsRepository = None):
        self.metrics_repository = metrics_repository or MetricsRepository()

    def snapshot_for_date(self, target_date):
        from apps.bookings.models import Booking
        from apps.courses.models import Course
        from apps.payments.models import Payment, UserSubscription
        from apps.users.models import User, UserRole

        day_start = timezone.make_aware(timezone.datetime.combine(target_date, timezone.datetime.min.time()))
        day_end = day_start + timedelta(days=1)

        gmv = (
            Booking.objects.filter(created_at__gte=day_start, created_at__lt=day_end).aggregate(total=Sum("price"))[
                "total"
            ]
            or Decimal("0")
        ) + (
            Course.objects.filter(created_at__gte=day_start, created_at__lt=day_end).aggregate(total=Sum("price"))[
                "total"
            ]
            or Decimal("0")
        )

        platform_revenue = Payment.objects.filter(
            status="paid", paid_at__gte=day_start, paid_at__lt=day_end
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        return self.metrics_repository.upsert_for_date(
            target_date,
            total_users=User.objects.filter(created_at__lt=day_end).count(),
            total_tutors=User.objects.filter(role=UserRole.TUTOR, created_at__lt=day_end).count(),
            total_students=User.objects.filter(role=UserRole.STUDENT, created_at__lt=day_end).count(),
            new_signups=User.objects.filter(created_at__gte=day_start, created_at__lt=day_end).count(),
            total_bookings_created=Booking.objects.filter(created_at__gte=day_start, created_at__lt=day_end).count(),
            completed_bookings=Booking.objects.filter(
                status="completed", completed_at__gte=day_start, completed_at__lt=day_end
            ).count(),
            cancelled_bookings=Booking.objects.filter(
                status="cancelled", cancelled_at__gte=day_start, cancelled_at__lt=day_end
            ).count(),
            gross_merchandise_value=gmv,
            platform_revenue=platform_revenue,
            active_subscriptions=UserSubscription.objects.filter(status="active").count(),
        )

    def get_trend(self, start_date, end_date):
        return self.metrics_repository.list_range(start_date, end_date)
