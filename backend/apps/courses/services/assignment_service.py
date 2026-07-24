from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.courses.models import SubmissionStatus
from apps.courses.repositories.assignment_repository import AssignmentRepository, SubmissionRepository
from apps.courses.repositories.course_repository import EnrollmentRepository


class AssignmentService:
    def __init__(
        self,
        assignment_repository: AssignmentRepository = None,
        submission_repository: SubmissionRepository = None,
        enrollment_repository: EnrollmentRepository = None,
    ):
        self.assignment_repository = assignment_repository or AssignmentRepository()
        self.submission_repository = submission_repository or SubmissionRepository()
        self.enrollment_repository = enrollment_repository or EnrollmentRepository()

    def create_assignment(self, course, *, created_by, **fields):
        return self.assignment_repository.create(course=course, created_by=created_by, **fields)

    def submit(self, assignment, student, *, text_answer: str = "", attachment=None):
        enrollment = self.enrollment_repository.get_active(assignment.course, student)
        if not enrollment:
            raise PermissionDeniedError("You must be actively enrolled in this course to submit assignments.")

        if self.submission_repository.get(assignment, student):
            raise ConflictError("You have already submitted this assignment.")

        if not text_answer and not attachment:
            raise ApplicationError("Provide a text answer or an attachment.")

        status = SubmissionStatus.LATE if timezone.now() > assignment.due_at else SubmissionStatus.SUBMITTED
        return self.submission_repository.create(
            assignment=assignment, student=student, text_answer=text_answer, attachment=attachment, status=status
        )

    def grade(self, submission, *, graded_by, score: int, feedback: str = ""):
        if score > submission.assignment.max_score:
            raise ApplicationError(
                f"Score cannot exceed the assignment's max score of {submission.assignment.max_score}."
            )

        return self.submission_repository.update(
            submission,
            score=score,
            feedback=feedback,
            status=SubmissionStatus.GRADED,
            graded_by=graded_by,
            graded_at=timezone.now(),
        )
