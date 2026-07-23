"""
The permission registry — the single source of truth for permission codenames.

Codenames are referenced by code (`HasPermission("bookings.create")`), so code
owns them; the `rbac_permissions` table is synced FROM this file (create
missing, refresh name/module). This is intentionally the opposite of master
data, where the database owns the values (ADR-001).

Format: (codename, human name, module).
"""

PERMISSION_REGISTRY: list[tuple[str, str, str]] = [
    # ---------------------------------------------------------------- bookings
    ("bookings.view_own", "View own bookings", "bookings"),
    ("bookings.create", "Create booking requests", "bookings"),
    ("bookings.cancel_own", "Cancel own bookings", "bookings"),
    ("bookings.manage_requests", "Accept or decline booking requests", "bookings"),
    ("bookings.manage_availability", "Manage availability slots", "bookings"),
    # ---------------------------------------------------------------- courses
    ("courses.view", "Browse published courses", "courses"),
    ("courses.enroll", "Enroll in courses", "courses"),
    ("courses.manage_own", "Create and manage own courses", "courses"),
    ("courses.grade", "Review and grade submissions", "courses"),
    # ---------------------------------------------------------------- payments
    ("payments.pay", "Pay for bookings and courses", "payments"),
    ("payments.topup_wallet", "Top up wallet", "payments"),
    ("payments.view_own_ledger", "View own wallet ledger", "payments"),
    ("payments.subscribe", "Purchase subscription plans", "payments"),
    # ---------------------------------------------------------------- chat & reviews
    ("chat.send", "Send chat messages", "chat"),
    ("reviews.write", "Write reviews after sessions", "reviews"),
    ("reviews.respond", "Respond to received reviews", "reviews"),
    # ---------------------------------------------------------------- profiles
    ("tutors.manage_profile", "Manage tutor profile and subjects", "tutors"),
    ("tutors.request_verification", "Submit verification documents", "tutors"),
    ("students.manage_profile", "Manage student learning profile", "students"),
    ("parents.manage_children", "Link and manage children", "parents"),
    ("parents.view_child_activity", "View child bookings and progress", "parents"),
    ("institutes.manage_profile", "Manage institute profile", "institutes"),
    ("institutes.manage_members", "Invite and manage institute tutors", "institutes"),
    ("institutes.manage_students", "Enroll and manage institute students", "institutes"),
    # ---------------------------------------------------------------- platform admin
    ("admin.view_dashboard", "View platform dashboard", "admin"),
    ("admin.manage_users", "View and manage users", "admin"),
    ("admin.manage_verifications", "Review tutor verifications", "admin"),
    ("admin.manage_bookings", "View all bookings", "admin"),
    ("admin.manage_payments", "View all payments", "admin"),
    ("admin.manage_payouts", "Approve payouts", "admin"),
    ("admin.manage_coupons", "Manage coupons", "admin"),
    ("admin.view_analytics", "View platform analytics", "admin"),
    # ---------------------------------------------------------------- governance
    ("masterdata.view", "View master data", "masterdata"),
    ("masterdata.manage", "Manage master data", "masterdata"),
    ("rbac.view", "View roles and permissions", "rbac"),
    ("rbac.manage_roles", "Create and edit roles", "rbac"),
    ("rbac.assign_roles", "Assign roles to users", "rbac"),
]

ALL_CODENAMES = [codename for codename, _, _ in PERMISSION_REGISTRY]

# Default permission sets for the five seeded system roles. "*" = everything.
# These are DEFAULTS at seed time; admins may tailor non-admin roles afterward.
DEFAULT_ROLE_PERMISSIONS: dict[str, list[str] | str] = {
    "student": [
        "bookings.view_own", "bookings.create", "bookings.cancel_own",
        "courses.view", "courses.enroll",
        "payments.pay", "payments.topup_wallet", "payments.view_own_ledger", "payments.subscribe",
        "chat.send", "reviews.write", "students.manage_profile",
    ],
    "tutor": [
        "bookings.view_own", "bookings.manage_requests", "bookings.manage_availability", "bookings.cancel_own",
        "courses.view", "courses.manage_own", "courses.grade",
        "payments.view_own_ledger",
        "chat.send", "reviews.respond",
        "tutors.manage_profile", "tutors.request_verification",
    ],
    "parent": [
        "bookings.view_own", "bookings.create", "bookings.cancel_own",
        "courses.view", "payments.pay", "payments.view_own_ledger",
        "chat.send", "parents.manage_children", "parents.view_child_activity",
    ],
    "institute_admin": [
        "courses.view", "chat.send",
        "institutes.manage_profile", "institutes.manage_members", "institutes.manage_students",
        "payments.view_own_ledger",
    ],
    "admin": "*",
}

SYSTEM_ROLE_NAMES: dict[str, tuple[str, str]] = {
    "student": ("Student", "Learns through 1-on-1 sessions and courses."),
    "tutor": ("Tutor", "Teaches sessions and courses; manages availability and earnings."),
    "parent": ("Parent", "Oversees linked children's learning and payments."),
    "institute_admin": ("Institute Admin", "Runs an institute: members, students, courses."),
    "admin": ("Platform Admin", "Full platform governance."),
}
