"""
Seed a complete, coherent demo world:

    python manage.py seed_demo

Idempotent — every object is looked up by a natural key (email, slug, code,
date, ...) before being created, so re-running tops up missing pieces instead
of duplicating. Wallet credits are only issued when their originating payment
record is created for the first time.

All demo accounts share the password below.
"""

import random
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

DEMO_PASSWORD = "Demo@12345"


class Command(BaseCommand):
    help = "Seed the database with a coherent demo dataset covering every portal."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding TutorDoor demo data..."))
        call_command("seed_master_data")

        subjects = self._seed_subjects()
        users = self._seed_users_and_profiles(subjects)
        self._seed_coupon_and_plan(users["admin"])
        courses = self._seed_courses(users, subjects)
        self._seed_bookings_payments_reviews(users, subjects)
        self._seed_chat(users)
        self._seed_metrics()

        self._print_summary(users, courses)

    # ------------------------------------------------------------------ subjects
    def _seed_subjects(self):
        from apps.tutors.models import Subject, SubjectCategory

        catalog = {
            "Academics": ["Mathematics", "Physics", "Chemistry", "Biology"],
            "Languages": ["Spoken English", "Hindi", "French"],
            "Technology": ["Python Programming", "Web Development"],
            "Arts": ["Guitar", "Painting"],
        }

        subjects = {}
        for category_name, subject_names in catalog.items():
            category, _ = SubjectCategory.objects.get_or_create(
                name=category_name, defaults={"slug": slugify(category_name)}
            )
            for name in subject_names:
                subject, _ = Subject.objects.get_or_create(
                    category=category, name=name, defaults={"slug": slugify(name)}
                )
                subjects[name] = subject
        self.stdout.write(f"  subjects: {len(subjects)} across {len(catalog)} categories")
        return subjects

    # ------------------------------------------------------------------ users
    def _get_user(self, email, first_name, last_name, role, **extra):
        from apps.users.models import User

        user = User.objects.filter(email=email).first()
        if user:
            return user, False
        user = User.objects.create_user(
            email=email,
            password=DEMO_PASSWORD,
            first_name=first_name,
            last_name=last_name,
            role=role,
            is_email_verified=True,
            **extra,
        )
        return user, True

    def _seed_users_and_profiles(self, subjects):
        from apps.institutes.models import InstituteProfile, InstituteStudentEnrollment, InstituteTutor
        from apps.parents.models import ParentProfile, ParentStudentLink
        from apps.students.models import StudentProfile
        from apps.tutors.models import TutorProfile, TutorSubject, WeeklyAvailability
        from apps.users.models import User

        users = {}

        # ---- platform admin -------------------------------------------------
        admin = User.objects.filter(email="admin@tutordoor.test").first()
        if not admin:
            admin = User.objects.create_superuser(
                email="admin@tutordoor.test",
                password=DEMO_PASSWORD,
                first_name="Priya",
                last_name="Admin",
                role="admin",
                is_email_verified=True,
            )
        users["admin"] = admin

        # ---- tutors ---------------------------------------------------------
        tutor_specs = [
            ("ananya.tutor@tutordoor.test", "Ananya", "Rao", "IIT-trained Physics tutor for JEE & boards",
             ["Physics", "Mathematics"], Decimal("700.00"), "Bengaluru", "verified", 6),
            ("rahul.tutor@tutordoor.test", "Rahul", "Verma", "Spoken English coach — interviews & IELTS",
             ["Spoken English"], Decimal("450.00"), "Delhi", "verified", 8),
            ("meera.tutor@tutordoor.test", "Meera", "Iyer", "Class 8–10 Maths, patient & exam-focused",
             ["Mathematics"], Decimal("500.00"), "Chennai", "verified", 5),
            ("kabir.tutor@tutordoor.test", "Kabir", "Shaikh", "Full-stack mentor — Python & the web",
             ["Python Programming", "Web Development"], Decimal("900.00"), "Pune", "pending", 4),
        ]

        users["tutors"] = []
        for email, first, last, headline, subject_names, rate, city, verification, years in tutor_specs:
            user, _ = self._get_user(email, first, last, "tutor")
            profile, _ = TutorProfile.objects.get_or_create(
                user=user,
                defaults={
                    "headline": headline,
                    "bio": f"{first} has taught for {years}+ years and focuses on concept-first learning.",
                    "education": "Postgraduate degree in the subject area",
                    "experience_years": years,
                    "hourly_rate": rate,
                    "teaching_mode": "both",
                    "languages": ["English", "Hindi"],
                    "city": city,
                    "state": "",
                    "country": "India",
                    "verification_status": verification,
                    "is_accepting_students": True,
                },
            )
            for subject_name in subject_names:
                TutorSubject.objects.get_or_create(
                    tutor=profile,
                    subject=subjects[subject_name],
                    defaults={"expertise_level": "all_levels", "years_experience": years},
                )
            # Weekday evenings + Saturday mornings.
            for day in range(0, 5):
                WeeklyAvailability.objects.get_or_create(
                    tutor=profile, day_of_week=day, start_time=time(16, 0),
                    defaults={"end_time": time(20, 0), "is_active": True},
                )
            WeeklyAvailability.objects.get_or_create(
                tutor=profile, day_of_week=5, start_time=time(10, 0),
                defaults={"end_time": time(14, 0), "is_active": True},
            )
            users["tutors"].append(profile)

        # ---- students -------------------------------------------------------
        student_specs = [
            ("aarav.student@tutordoor.test", "Aarav", "Sharma"),
            ("diya.student@tutordoor.test", "Diya", "Patel"),
            ("ishaan.student@tutordoor.test", "Ishaan", "Kumar"),
        ]
        users["students"] = []
        for email, first, last in student_specs:
            user, _ = self._get_user(email, first, last, "student")
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            users["students"].append(profile)

        # ---- parent linked to the first student ----------------------------
        parent_user, _ = self._get_user("sunita.parent@tutordoor.test", "Sunita", "Sharma", "parent")
        parent_profile, _ = ParentProfile.objects.get_or_create(user=parent_user)
        ParentStudentLink.objects.get_or_create(
            parent=parent_profile,
            student=users["students"][0],
            defaults={
                "relationship": "mother",
                "status": "active",
                "can_manage_bookings": True,
                "can_manage_payments": True,
                "can_view_progress": True,
                "confirmed_at": timezone.now(),
            },
        )
        users["parent"] = parent_profile

        # ---- institute with roster + one enrolled student -------------------
        institute_user, _ = self._get_user("contact@brightminds.test", "Vikram", "Mehta", "institute_admin")
        institute, _ = InstituteProfile.objects.get_or_create(
            user=institute_user,
            defaults={
                "institute_name": "BrightMinds Learning Center",
                "description": "A neighborhood coaching center for classes 6–12, now teaching online too.",
                "city": "Mumbai",
                "country": "India",
                "verification_status": "verified",
            },
        )
        InstituteTutor.objects.get_or_create(
            institute=institute,
            tutor=users["tutors"][2],
            defaults={"role_title": "Senior Faculty – Mathematics", "status": "active", "joined_at": timezone.now()},
        )
        InstituteStudentEnrollment.objects.get_or_create(
            institute=institute, student=users["students"][2], defaults={"status": "active"}
        )
        users["institute"] = institute

        self.stdout.write(
            f"  users: 1 admin, {len(users['tutors'])} tutors, {len(users['students'])} students, 1 parent, 1 institute"
        )
        return users

    # ------------------------------------------------------------------ coupon + plan
    def _seed_coupon_and_plan(self, admin):
        from apps.payments.models import Coupon, SubscriptionPlan

        now = timezone.now()
        Coupon.objects.get_or_create(
            code="WELCOME10",
            defaults={
                "description": "10% off your first booking or course",
                "discount_type": "percentage",
                "discount_value": Decimal("10.00"),
                "max_discount_amount": Decimal("200.00"),
                "applicable_to": "all",
                "valid_from": now - timedelta(days=1),
                "valid_until": now + timedelta(days=365),
                "usage_limit_per_user": 1,
                "is_active": True,
                "created_by": admin,
            },
        )
        SubscriptionPlan.objects.get_or_create(
            name="Tutor Pro",
            defaults={
                "target_role": "tutor",
                "description": "Reduced commission and featured placement in search.",
                "price": Decimal("999.00"),
                "billing_interval": "monthly",
                "features": ["Reduced platform commission", "Featured in search", "Priority support"],
                "commission_discount_percent": Decimal("5.0"),
                "is_active": True,
            },
        )
        self.stdout.write("  coupon WELCOME10 + Tutor Pro plan")

    # ------------------------------------------------------------------ courses
    def _seed_courses(self, users, subjects):
        from apps.courses.models import Course, CourseEnrollment, CourseSession
        from apps.payments.models import Payment
        from apps.payments.services.wallet_service import WalletService

        today = timezone.localdate()
        course_specs = [
            # (tutor idx, subject, title, price, status, total_sessions)
            (0, "Physics", "JEE Physics Crash Course", Decimal("2999.00"), "published", 8),
            (1, "Spoken English", "Interview English in 4 Weeks", Decimal("0.00"), "published", 8),
            (3, "Python Programming", "Python from Zero (draft)", Decimal("1999.00"), "draft", 6),
        ]

        courses = []
        for tutor_index, subject_name, title, price, status, total_sessions in course_specs:
            tutor = users["tutors"][tutor_index]
            course, _ = Course.objects.get_or_create(
                tutor=tutor,
                title=title,
                defaults={
                    "subject": subjects[subject_name],
                    "created_by": tutor.user,
                    "description": f"A structured {total_sessions}-session program taught live by {tutor.user.first_name}.",
                    "level": "all_levels",
                    "mode": "online",
                    "total_sessions": total_sessions,
                    "duration_weeks": 4,
                    "max_students": 12,
                    "price": price,
                    "status": status,
                    "start_date": today + timedelta(days=7),
                    "end_date": today + timedelta(days=35),
                },
            )
            if status == "published":
                for number in range(1, total_sessions + 1):
                    start = timezone.now().replace(minute=0, second=0, microsecond=0) + timedelta(
                        days=7 + (number - 1) * 3, hours=2
                    )
                    CourseSession.objects.get_or_create(
                        course=course,
                        session_number=number,
                        defaults={
                            "title": f"Session {number}",
                            "scheduled_start": start,
                            "scheduled_end": start + timedelta(minutes=90),
                        },
                    )
            courses.append(course)

        # Student 2 actively enrolled (paid) in the JEE course, part-way through.
        paid_course = courses[0]
        enrollment, _ = CourseEnrollment.objects.get_or_create(
            course=paid_course,
            student=users["students"][1],
            defaults={"status": "active", "progress_percent": Decimal("37.50")},
        )
        payment, payment_created = Payment.objects.get_or_create(
            purpose="course_enrollment",
            reference_id=enrollment.id,
            defaults={
                "user": users["students"][1].user,
                "gateway": "razorpay",
                "amount": paid_course.price,
                "discount_amount": Decimal("0.00"),
                "status": "paid",
                "gateway_order_id": "order_demo_course1",
                "gateway_payment_id": "pay_demo_course1",
                "paid_at": timezone.now() - timedelta(days=3),
            },
        )
        if payment_created:
            WalletService().credit(
                paid_course.tutor.user,
                amount=(paid_course.price * Decimal("0.85")).quantize(Decimal("0.01")),
                category="course_payout",
                description=f"Payout · {paid_course.title}",
                reference_type="course_enrollment",
                reference_id=enrollment.id,
            )

        self.stdout.write(f"  courses: {len(courses)} (2 published, 1 draft) + 1 paid enrollment")
        return courses

    # ------------------------------------------------------------------ bookings + payments + reviews
    def _seed_bookings_payments_reviews(self, users, subjects):
        from apps.bookings.models import Booking
        from apps.payments.models import Payment
        from apps.payments.services.wallet_service import WalletService
        from apps.reviews.models import TutorReview
        from apps.reviews.services.review_service import TutorReviewService

        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        student_a, student_b, _ = users["students"]
        tutor_physics, tutor_english, tutor_maths, _ = users["tutors"]

        def make_booking(student, tutor, subject_name, start, *, status, payment_status, price, is_demo=False, **extra):
            booking, created = Booking.objects.get_or_create(
                tutor=tutor,
                start_time=start,
                defaults={
                    "student": student,
                    "subject": subjects[subject_name],
                    "booking_type": "demo" if is_demo else "regular",
                    "mode": "online",
                    "status": status,
                    "end_time": start + timedelta(hours=1),
                    "price": price,
                    "payment_status": payment_status,
                    "booked_by": student.user,
                    **extra,
                },
            )
            return booking, created

        # Two completed past sessions (paid + reviewed → tutor payout + rating).
        completed_specs = [
            (student_a, tutor_physics, "Physics", now - timedelta(days=6), Decimal("700.00"), 5,
             "Explains every mistake like a note in the margin. Brilliant."),
            (student_b, tutor_maths, "Mathematics", now - timedelta(days=4), Decimal("500.00"), 4,
             "Patient and structured — my daughter finally enjoys maths homework."),
        ]
        for student, tutor, subject_name, start, price, rating, comment in completed_specs:
            booking, created = make_booking(
                student, tutor, subject_name, start,
                status="completed", payment_status="paid", price=price,
                completed_at=start + timedelta(hours=1),
            )
            payment, payment_created = Payment.objects.get_or_create(
                purpose="booking",
                reference_id=booking.id,
                defaults={
                    "user": student.user,
                    "gateway": "razorpay",
                    "amount": price,
                    "discount_amount": Decimal("0.00"),
                    "status": "paid",
                    "gateway_order_id": f"order_demo_{booking.id.hex[:8]}",
                    "gateway_payment_id": f"pay_demo_{booking.id.hex[:8]}",
                    "paid_at": start - timedelta(hours=2),
                },
            )
            if payment_created:
                WalletService().credit(
                    tutor.user,
                    amount=(price * Decimal("0.85")).quantize(Decimal("0.01")),
                    category="booking_payout",
                    description=f"Payout · session with {student.user.first_name}",
                    reference_type="booking",
                    reference_id=booking.id,
                )
            TutorReview.objects.get_or_create(
                booking=booking,
                defaults={"student": student, "tutor": tutor, "rating": rating, "comment": comment},
            )
            if created:
                tutor.total_sessions_completed = tutor.total_sessions_completed + 1
                tutor.save(update_fields=["total_sessions_completed"])

        # Upcoming confirmed session (joinable live-class demo).
        make_booking(
            student_a, tutor_physics, "Physics", now + timedelta(days=2),
            status="confirmed", payment_status="paid", price=Decimal("700.00"),
        )
        # Awaiting payment — exercises the checkout page.
        make_booking(
            student_a, tutor_english, "Spoken English", now + timedelta(days=3),
            status="pending_payment", payment_status="pending", price=Decimal("450.00"),
        )
        # A free demo class, confirmed.
        make_booking(
            student_b, tutor_english, "Spoken English", now + timedelta(days=4),
            status="confirmed", payment_status="not_required", price=Decimal("0.00"), is_demo=True,
        )
        # One cancelled, for the cancelled tab.
        make_booking(
            student_b, tutor_physics, "Physics", now - timedelta(days=2),
            status="cancelled", payment_status="not_required", price=Decimal("700.00"),
            cancellation_reason="Schedule clash — exam moved.", cancelled_at=now - timedelta(days=3),
        )

        # Recompute tutor rating aggregates from the seeded reviews.
        review_service = TutorReviewService()
        for tutor in {tutor_physics, tutor_maths}:
            review_service._recompute_tutor_rating(tutor)

        self.stdout.write("  bookings: 2 completed(+paid+reviewed+payout), 1 confirmed, 1 pending payment, 1 demo, 1 cancelled")

    # ------------------------------------------------------------------ chat
    def _seed_chat(self, users):
        from apps.chat.models import Conversation, ConversationParticipant, Message

        student_user = users["students"][0].user
        tutor_user = users["tutors"][0].user

        conversation = (
            Conversation.objects.filter(participants=student_user).filter(participants=tutor_user).first()
        )
        if not conversation:
            conversation = Conversation.objects.create()
            ConversationParticipant.objects.create(conversation=conversation, user=student_user)
            ConversationParticipant.objects.create(conversation=conversation, user=tutor_user)
            Message.objects.create(
                conversation=conversation, sender=student_user,
                content="Hi Ananya! Before Friday's class — could we spend extra time on rotational motion?",
            )
            Message.objects.create(
                conversation=conversation, sender=tutor_user,
                content="Absolutely, Aarav. Bring the last mock paper and we'll work through Q7 together.",
            )
        self.stdout.write("  chat: 1 conversation with 2 messages")

    # ------------------------------------------------------------------ metrics
    def _seed_metrics(self):
        from apps.analytics.models import DailyPlatformMetrics

        rng = random.Random(42)  # deterministic across runs
        today = timezone.localdate()
        base_users, created_count = 240, 0

        for offset in range(29, -1, -1):
            day = today - timedelta(days=offset)
            growth = (29 - offset)
            _, created = DailyPlatformMetrics.objects.get_or_create(
                date=day,
                defaults={
                    "total_users": base_users + growth * 6 + rng.randint(0, 4),
                    "total_tutors": 40 + growth,
                    "total_students": 180 + growth * 4,
                    "new_signups": rng.randint(3, 14),
                    "total_bookings_created": rng.randint(8, 26),
                    "completed_bookings": rng.randint(5, 20),
                    "cancelled_bookings": rng.randint(0, 4),
                    "gross_merchandise_value": Decimal(rng.randint(6000, 22000)),
                    "platform_revenue": Decimal(rng.randint(900, 3300)),
                    "active_subscriptions": 12 + growth // 3,
                },
            )
            created_count += int(created)
        self.stdout.write(f"  metrics: {created_count} new daily snapshots (30-day window)")

    # ------------------------------------------------------------------ summary
    def _print_summary(self, users, courses):
        self.stdout.write(self.style.SUCCESS("\nDemo world ready. All accounts use password: " + DEMO_PASSWORD))
        rows = [
            ("Admin", "admin@tutordoor.test", "/admin (portal: /admin after login)"),
            ("Tutor (verified)", "ananya.tutor@tutordoor.test", "availability, bookings, earnings, chat"),
            ("Tutor (pending)", "kabir.tutor@tutordoor.test", "verification flow"),
            ("Student", "aarav.student@tutordoor.test", "bookings incl. one awaiting payment, chat"),
            ("Student (enrolled)", "diya.student@tutordoor.test", "active paid course with progress"),
            ("Parent", "sunita.parent@tutordoor.test", "linked to Aarav — bookings, progress"),
            ("Institute", "contact@brightminds.test", "roster + enrolled student"),
        ]
        for label, email, note in rows:
            self.stdout.write(f"  {label:<20} {email:<32} {note}")
        self.stdout.write("\nTip: log in as the student and pay the pending booking with coupon WELCOME10.")
        call_command("seed_rbac")
