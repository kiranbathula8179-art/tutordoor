from typing import Optional

from apps.courses.models import Assignment, AssignmentSubmission


class AssignmentRepository:
    model = Assignment

    def create(self, **fields) -> Assignment:
        return self.model.objects.create(**fields)

    def get_by_id(self, assignment_id) -> Optional[Assignment]:
        return self.model.objects.select_related("course").filter(id=assignment_id).first()

    def list_for_course(self, course):
        return self.model.objects.filter(course=course).order_by("due_at")

    def update(self, assignment: Assignment, **fields) -> Assignment:
        for key, value in fields.items():
            setattr(assignment, key, value)
        assignment.save(update_fields=list(fields.keys()) + ["updated_at"])
        return assignment


class SubmissionRepository:
    model = AssignmentSubmission

    def create(self, **fields) -> AssignmentSubmission:
        return self.model.objects.create(**fields)

    def get(self, assignment, student) -> Optional[AssignmentSubmission]:
        return self.model.objects.filter(assignment=assignment, student=student).first()

    def get_by_id(self, submission_id) -> Optional[AssignmentSubmission]:
        return self.model.objects.select_related("assignment__course", "student__user").filter(id=submission_id).first()

    def list_for_assignment(self, assignment):
        return self.model.objects.filter(assignment=assignment).select_related("student__user")

    def list_for_student(self, student, course=None):
        qs = self.model.objects.filter(student=student).select_related("assignment__course")
        if course:
            qs = qs.filter(assignment__course=course)
        return qs

    def update(self, submission: AssignmentSubmission, **fields) -> AssignmentSubmission:
        for key, value in fields.items():
            setattr(submission, key, value)
        submission.save(update_fields=list(fields.keys()) + ["updated_at"])
        return submission

    def count_graded_for_student(self, student, course) -> int:
        return self.model.objects.filter(
            student=student, assignment__course=course, status="graded"
        ).count()

    def count_total_for_course(self, course) -> int:
        return Assignment.objects.filter(course=course).count()
