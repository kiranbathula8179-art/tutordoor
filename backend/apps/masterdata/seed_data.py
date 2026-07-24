"""Master data vocabulary seed — shared by the 0002 data migration and
the `seed_master_data` command. `apply_seed` takes model classes so the
migration can pass historical models. Idempotent; get_or_create only —
admin edits are never clobbered (ADR-001)."""

# (code, name, description)
TYPES: list[tuple[str, str, str]] = [
    ("grade_level", "Grade Levels", "Student academic stage used on student profiles."),
    ("skill_level", "Skill Levels", "Shared proficiency scale for tutor subject expertise and course levels."),
    ("document_type", "Verification Document Types", "Documents accepted for tutor verification."),
    ("relationship_type", "Guardian Relationships", "Parent-student link relationship options."),
    ("language", "Languages", "Languages tutors can teach in."),
    ("tutor_specialization", "Tutor Specializations", "Focus areas tutors can tag on their profiles."),
    ("student_interest", "Student Interests", "Interests students can tag for better matching."),
    ("institute_type", "Institute Types", "Kinds of institutes on the platform."),
    ("badge_type", "Badge Types", "Recognition badges awardable to users."),
    ("certificate_type", "Certificate Types", "Certificates issuable for achievements."),
    ("cancellation_reason", "Cancellation Reasons", "Structured reasons offered when cancelling a booking."),
    ("country", "Countries", "Country reference list for address dropdowns."),
    ("state", "States / Regions", "State reference list; metadata.country links upward."),
    ("city", "Cities", "City reference list; metadata.state links upward."),
    ("notification_template", "Notification Templates", "Editable subject/body templates; metadata holds the content."),
]

Simple = list[tuple[str, str]]

GRADE_LEVELS: Simple = [
    ("primary", "Primary School (1-5)"),
    ("middle", "Middle School (6-8)"),
    ("secondary", "Secondary School (9-10)"),
    ("senior_secondary", "Senior Secondary (11-12)"),
    ("undergraduate", "Undergraduate"),
    ("graduate", "Graduate"),
    ("professional", "Working Professional"),
    ("other", "Other"),
]

SKILL_LEVELS: Simple = [
    ("beginner", "Beginner"),
    ("intermediate", "Intermediate"),
    ("advanced", "Advanced"),
    ("all_levels", "All Levels"),
]

DOCUMENT_TYPES: Simple = [
    ("government_id", "Government ID"),
    ("degree_certificate", "Degree Certificate"),
    ("experience_letter", "Experience Letter"),
    ("police_verification", "Police Verification"),
    ("address_proof", "Address Proof"),
]

RELATIONSHIP_TYPES: Simple = [
    ("father", "Father"),
    ("mother", "Mother"),
    ("guardian", "Guardian"),
    ("other", "Other"),
]

LANGUAGES: Simple = [
    ("english", "English"), ("hindi", "Hindi"), ("tamil", "Tamil"), ("telugu", "Telugu"),
    ("kannada", "Kannada"), ("malayalam", "Malayalam"), ("marathi", "Marathi"),
    ("bengali", "Bengali"), ("gujarati", "Gujarati"), ("punjabi", "Punjabi"),
    ("urdu", "Urdu"), ("french", "French"), ("spanish", "Spanish"), ("german", "German"),
]

TUTOR_SPECIALIZATIONS: Simple = [
    ("board_exams", "Board Exam Preparation"), ("jee", "JEE (Engineering Entrance)"),
    ("neet", "NEET (Medical Entrance)"), ("ielts_toefl", "IELTS / TOEFL"),
    ("spoken_english", "Spoken English & Interviews"), ("competitive_coding", "Competitive Coding"),
    ("web_development", "Web Development"), ("data_science", "Data Science & AI"),
    ("music", "Music"), ("fine_arts", "Fine Arts"), ("career_counseling", "Career Counseling"),
    ("corporate_training", "Corporate Training"),
]

STUDENT_INTERESTS: Simple = [
    ("science", "Science"), ("mathematics", "Mathematics"), ("coding", "Coding"),
    ("languages", "Languages"), ("music", "Music"), ("arts", "Arts"),
    ("exam_prep", "Exam Preparation"), ("public_speaking", "Public Speaking"),
]

INSTITUTE_TYPES: Simple = [
    ("coaching_center", "Coaching Center"), ("school", "School"), ("college", "College"),
    ("edtech_company", "EdTech Company"), ("ngo", "NGO / Non-profit"), ("other", "Other"),
]

BADGE_TYPES: Simple = [
    ("verified_tutor", "Verified Tutor"), ("top_rated", "Top Rated"),
    ("fast_responder", "Fast Responder"), ("hundred_sessions", "100 Sessions Club"),
    ("student_favorite", "Student Favorite"),
]

CERTIFICATE_TYPES: Simple = [
    ("course_completion", "Course Completion"), ("excellence", "Certificate of Excellence"),
    ("participation", "Participation"),
]

CANCELLATION_REASONS: Simple = [
    ("schedule_conflict", "Schedule conflict"), ("illness", "Illness"),
    ("tutor_unavailable", "Tutor became unavailable"), ("technical_issue", "Technical issue"),
    ("found_alternative", "Found an alternative"), ("other", "Other"),
]

COUNTRIES: Simple = [("in", "India"), ("ae", "United Arab Emirates"), ("sg", "Singapore"), ("us", "United States")]

STATES: list[tuple[str, str, dict]] = [
    ("ka", "Karnataka", {"country": "in"}), ("mh", "Maharashtra", {"country": "in"}),
    ("dl", "Delhi", {"country": "in"}), ("tn", "Tamil Nadu", {"country": "in"}),
    ("ts", "Telangana", {"country": "in"}), ("wb", "West Bengal", {"country": "in"}),
]

CITIES: list[tuple[str, str, dict]] = [
    ("bengaluru", "Bengaluru", {"state": "ka", "country": "in"}),
    ("mumbai", "Mumbai", {"state": "mh", "country": "in"}),
    ("pune", "Pune", {"state": "mh", "country": "in"}),
    ("new_delhi", "New Delhi", {"state": "dl", "country": "in"}),
    ("chennai", "Chennai", {"state": "tn", "country": "in"}),
    ("hyderabad", "Hyderabad", {"state": "ts", "country": "in"}),
    ("kolkata", "Kolkata", {"state": "wb", "country": "in"}),
]

NOTIFICATION_TEMPLATES: list[tuple[str, str, dict]] = [
    (
        "booking_confirmed",
        "Booking Confirmed",
        {
            "subject": "Your session with {tutor_name} is confirmed",
            "body": (
                "Hi {student_name}, your {subject} session on {start_time} is confirmed. "
                "Join from your bookings page."
            ),
        },
    ),
    (
        "booking_reminder",
        "Booking Reminder",
        {
            "subject": "Reminder: {subject} session at {start_time}",
            "body": "Hi {student_name}, your session with {tutor_name} starts soon. See you in class!",
        },
    ),
    (
        "verification_approved",
        "Tutor Verification Approved",
        {
            "subject": "You're verified on TutorDoor 🎉",
            "body": "Hi {tutor_name}, your documents were approved. Your profile now shows the verified badge.",
        },
    ),
]


def apply_seed(TypeModel, ItemModel) -> tuple[int, int]:
    """Returns (types_ensured, items_created)."""
    type_map = {}
    for code, name, description in TYPES:
        data_type, _ = TypeModel.objects.get_or_create(
            code=code, defaults={"name": name, "description": description, "is_system": True}
        )
        type_map[code] = data_type

    def seed_simple(data_type, rows):
        made = 0
        for order, (code, label) in enumerate(rows):
            _, created = ItemModel.objects.get_or_create(
                type=data_type, code=code, defaults={"label": label, "sort_order": order}
            )
            made += int(created)
        return made

    def seed_meta(data_type, rows):
        made = 0
        for order, (code, label, metadata) in enumerate(rows):
            _, created = ItemModel.objects.get_or_create(
                type=data_type, code=code,
                defaults={"label": label, "sort_order": order, "metadata": metadata},
            )
            made += int(created)
        return made

    created = 0
    created += seed_simple(type_map["grade_level"], GRADE_LEVELS)
    created += seed_simple(type_map["skill_level"], SKILL_LEVELS)
    created += seed_simple(type_map["document_type"], DOCUMENT_TYPES)
    created += seed_simple(type_map["relationship_type"], RELATIONSHIP_TYPES)
    created += seed_simple(type_map["language"], LANGUAGES)
    created += seed_simple(type_map["tutor_specialization"], TUTOR_SPECIALIZATIONS)
    created += seed_simple(type_map["student_interest"], STUDENT_INTERESTS)
    created += seed_simple(type_map["institute_type"], INSTITUTE_TYPES)
    created += seed_simple(type_map["badge_type"], BADGE_TYPES)
    created += seed_simple(type_map["certificate_type"], CERTIFICATE_TYPES)
    created += seed_simple(type_map["cancellation_reason"], CANCELLATION_REASONS)
    created += seed_simple(type_map["country"], COUNTRIES)
    created += seed_meta(type_map["state"], STATES)
    created += seed_meta(type_map["city"], CITIES)
    created += seed_meta(type_map["notification_template"], NOTIFICATION_TEMPLATES)
    return len(TYPES), created
