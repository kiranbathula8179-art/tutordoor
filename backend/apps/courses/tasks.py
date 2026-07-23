import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("tutordoor")


@shared_task
def auto_complete_past_course_sessions_task():
    """Runs periodically: flips course sessions whose scheduled_end has passed to COMPLETED."""
    from apps.courses.repositories.course_repository import CourseSessionRepository

    repository = CourseSessionRepository()
    due_sessions = repository.list_due_for_auto_complete()
    count = 0
    for session in due_sessions:
        repository.update(session, status="completed")
        count += 1
    if count:
        logger.info("Auto-completed %d course sessions.", count)
    return count


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def notify_new_assignment_task(self, assignment_id: str):
    from apps.courses.repositories.assignment_repository import AssignmentRepository
    from apps.courses.repositories.course_repository import EnrollmentRepository

    assignment = AssignmentRepository().get_by_id(assignment_id)
    if not assignment:
        return

    enrollments = EnrollmentRepository().list_for_course(assignment.course, status="active")
    try:
        for enrollment in enrollments:
            send_mail(
                subject=f"New assignment posted: {assignment.title}",
                message=(
                    f"A new assignment '{assignment.title}' has been posted in "
                    f"{assignment.course.title}. Due by {assignment.due_at.strftime('%d %b %Y, %I:%M %p')}."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[enrollment.student.user.email],
                fail_silently=False,
            )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to notify students of new assignment %s", assignment_id)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def notify_submission_graded_task(self, submission_id: str):
    from apps.courses.repositories.assignment_repository import SubmissionRepository

    submission = SubmissionRepository().get_by_id(submission_id)
    if not submission:
        return

    try:
        send_mail(
            subject=f"Your submission for '{submission.assignment.title}' has been graded",
            message=(
                f"You scored {submission.score}/{submission.assignment.max_score}.\n\n"
                f"Feedback: {submission.feedback or 'No additional feedback provided.'}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[submission.student.user.email],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to notify student of graded submission %s", submission_id)
        raise self.retry(exc=exc)
