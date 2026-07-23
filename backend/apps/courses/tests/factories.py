import datetime

import factory
from factory.django import DjangoModelFactory

from apps.courses.models import Assignment, Course
from apps.tutors.tests.factories import SubjectFactory, TutorProfileFactory


class CourseFactory(DjangoModelFactory):
    class Meta:
        model = Course

    tutor = factory.SubFactory(TutorProfileFactory)
    subject = factory.SubFactory(SubjectFactory)
    title = factory.Sequence(lambda n: f"Complete Algebra Bootcamp {n}")
    total_sessions = 4
    duration_weeks = 4
    max_students = 5
    price = 2000
    status = "published"

    @factory.lazy_attribute
    def created_by(self):
        return self.tutor.user


class AssignmentFactory(DjangoModelFactory):
    class Meta:
        model = Assignment

    course = factory.SubFactory(CourseFactory)
    title = factory.Sequence(lambda n: f"Assignment {n}")
    max_score = 100
    due_at = factory.LazyFunction(
        lambda: datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    )

    @factory.lazy_attribute
    def created_by(self):
        return self.course.tutor.user
