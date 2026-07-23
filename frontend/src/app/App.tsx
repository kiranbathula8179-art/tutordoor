import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { RouteErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PageLoader } from "@/components/ui/Spinner";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { NotFoundPage } from "@/features/shared/pages/NotFoundPage";

import { adminNavItems } from "@/features/admin/nav";
import { instituteNavItems } from "@/features/institute/nav";
import { parentNavItems } from "@/features/parent/nav";
import { studentNavItems } from "@/features/student/nav";
import { tutorNavItems } from "@/features/tutor/nav";

/**
 * Routing.
 *
 * EAGER (initial bundle): landing, the five auth pages, layout shells, and the
 * 404 — everything a first-time visitor needs to see something immediately.
 *
 * LAZY (separate chunks): every marketing sub-page and all five authenticated
 * portals. Addresses the production-readiness audit finding MEDIUM-1: guests
 * previously downloaded the entire authenticated application (48 eager page
 * modules) just to view the landing page.
 *
 * Components are named exports, hence the `.then(m => ({ default: m.X }))`
 * mapping — React.lazy requires a default export.
 */

// ---- Marketing (lazy) -------------------------------------------------------
const TutorSearchPage = lazy(() =>
  import("@/features/tutors/pages/TutorSearchPage").then((m) => ({ default: m.TutorSearchPage }))
);
const TutorProfilePage = lazy(() =>
  import("@/features/tutors/pages/TutorProfilePage").then((m) => ({ default: m.TutorProfilePage }))
);
const PublicCoursesPage = lazy(() =>
  import("@/features/courses/pages/PublicCoursesPage").then((m) => ({ default: m.PublicCoursesPage }))
);
const PublicCourseDetailPage = lazy(() =>
  import("@/features/courses/pages/PublicCourseDetailPage").then((m) => ({
    default: m.PublicCourseDetailPage,
  }))
);
const AboutPage = lazy(() =>
  import("@/features/static/pages/AboutTrustPages").then((m) => ({ default: m.AboutPage }))
);
const TrustSafetyPage = lazy(() =>
  import("@/features/static/pages/AboutTrustPages").then((m) => ({ default: m.TrustSafetyPage }))
);
const SupportPage = lazy(() =>
  import("@/features/static/pages/SupportPage").then((m) => ({ default: m.SupportPage }))
);
const TermsPage = lazy(() =>
  import("@/features/static/pages/LegalPages").then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import("@/features/static/pages/LegalPages").then((m) => ({ default: m.PrivacyPage }))
);
const RefundsPage = lazy(() =>
  import("@/features/static/pages/LegalPages").then((m) => ({ default: m.RefundsPage }))
);
const ParentLinkConfirmPage = lazy(() =>
  import("@/features/parent/pages/ParentLinkConfirmPage").then((m) => ({
    default: m.ParentLinkConfirmPage,
  }))
);

// ---- Shared portal pages (lazy) --------------------------------------------
const BookingsListPage = lazy(() =>
  import("@/features/bookings/pages/BookingsListPage").then((m) => ({ default: m.BookingsListPage }))
);
const BookingDetailPage = lazy(() =>
  import("@/features/bookings/pages/BookingDetailPage").then((m) => ({ default: m.BookingDetailPage }))
);
const BookingPaymentPage = lazy(() =>
  import("@/features/payments/pages/BookingPaymentPage").then((m) => ({
    default: m.BookingPaymentPage,
  }))
);
const WalletPage = lazy(() =>
  import("@/features/payments/pages/WalletPage").then((m) => ({ default: m.WalletPage }))
);
const ChatPage = lazy(() =>
  import("@/features/chat/pages/ChatPage").then((m) => ({ default: m.ChatPage }))
);
const PlaceholderPage = lazy(() =>
  import("@/features/shared/pages/PlaceholderPage").then((m) => ({ default: m.PlaceholderPage }))
);

// ---- Student portal (lazy) --------------------------------------------------
const StudentDashboardPage = lazy(() =>
  import("@/features/student/pages/StudentDashboardPage").then((m) => ({
    default: m.StudentDashboardPage,
  }))
);
const StudentProfilePage = lazy(() =>
  import("@/features/student/pages/StudentProfilePage").then((m) => ({ default: m.StudentProfilePage }))
);
const StudentCoursesPage = lazy(() =>
  import("@/features/courses/pages/StudentCoursesPage").then((m) => ({ default: m.StudentCoursesPage }))
);
const EnrollmentPaymentPage = lazy(() =>
  import("@/features/courses/pages/EnrollmentPaymentPage").then((m) => ({
    default: m.EnrollmentPaymentPage,
  }))
);

// ---- Tutor portal (lazy) ----------------------------------------------------
const TutorDashboardPage = lazy(() =>
  import("@/features/tutor/pages/TutorDashboardPage").then((m) => ({ default: m.TutorDashboardPage }))
);
const AvailabilityPage = lazy(() =>
  import("@/features/tutor/pages/AvailabilityPage").then((m) => ({ default: m.AvailabilityPage }))
);
const VerificationPage = lazy(() =>
  import("@/features/tutor/pages/VerificationPage").then((m) => ({ default: m.VerificationPage }))
);
const TutorProfileSettingsPage = lazy(() =>
  import("@/features/tutor/pages/TutorProfileSettingsPage").then((m) => ({
    default: m.TutorProfileSettingsPage,
  }))
);
const TutorCoursesPage = lazy(() =>
  import("@/features/courses/pages/TutorCoursesPage").then((m) => ({ default: m.TutorCoursesPage }))
);
const TutorCourseDetailPage = lazy(() =>
  import("@/features/courses/pages/TutorCourseDetailPage").then((m) => ({
    default: m.TutorCourseDetailPage,
  }))
);

// ---- Parent portal (lazy) ---------------------------------------------------
const ParentDashboardPage = lazy(() =>
  import("@/features/parent/pages/ParentDashboardPage").then((m) => ({ default: m.ParentDashboardPage }))
);
const ParentChildrenPage = lazy(() =>
  import("@/features/parent/pages/ParentChildrenPage").then((m) => ({ default: m.ParentChildrenPage }))
);
const ParentBookingsPage = lazy(() =>
  import("@/features/parent/pages/ParentBookingsPage").then((m) => ({ default: m.ParentBookingsPage }))
);
const ParentProgressPage = lazy(() =>
  import("@/features/parent/pages/ParentProgressPage").then((m) => ({ default: m.ParentProgressPage }))
);
const ParentPaymentsPage = lazy(() =>
  import("@/features/parent/pages/ParentPaymentsPage").then((m) => ({ default: m.ParentPaymentsPage }))
);

// ---- Institute portal (lazy) ------------------------------------------------
const InstituteDashboardPage = lazy(() =>
  import("@/features/institute/pages/InstituteDashboardPage").then((m) => ({
    default: m.InstituteDashboardPage,
  }))
);
const InstituteTutorsPage = lazy(() =>
  import("@/features/institute/pages/InstituteTutorsPage").then((m) => ({
    default: m.InstituteTutorsPage,
  }))
);
const InstituteStudentsPage = lazy(() =>
  import("@/features/institute/pages/InstituteStudentsPage").then((m) => ({
    default: m.InstituteStudentsPage,
  }))
);
const InstituteProfileSettingsPage = lazy(() =>
  import("@/features/institute/pages/InstituteProfileSettingsPage").then((m) => ({
    default: m.InstituteProfileSettingsPage,
  }))
);

// ---- Admin portal (lazy) ----------------------------------------------------
const AdminDashboardPage = lazy(() =>
  import("@/features/admin/pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);
const VerificationQueuePage = lazy(() =>
  import("@/features/admin/pages/VerificationQueuePage").then((m) => ({
    default: m.VerificationQueuePage,
  }))
);
const AdminUsersPage = lazy(() =>
  import("@/features/admin/pages/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage }))
);
const AdminBookingsPage = lazy(() =>
  import("@/features/admin/pages/AdminBookingsPage").then((m) => ({ default: m.AdminBookingsPage }))
);
const AdminPaymentsPage = lazy(() =>
  import("@/features/admin/pages/AdminPaymentsPage").then((m) => ({ default: m.AdminPaymentsPage }))
);
const AdminCouponsPage = lazy(() =>
  import("@/features/admin/pages/AdminCouponsPage").then((m) => ({ default: m.AdminCouponsPage }))
);
const AdminMasterDataPage = lazy(() =>
  import("@/features/admin/pages/AdminMasterDataPage").then((m) => ({ default: m.AdminMasterDataPage }))
);
const AdminReportsPage = lazy(() =>
  import("@/features/admin/pages/AdminReportsPage").then((m) => ({ default: m.AdminReportsPage }))
);

export function App() {
  return (
    <RouteErrorBoundary label="route">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --------------------------------------------- Cinematic world (own nav/footer) */}
          <Route path="/" element={<LandingPage />} />

          {/* ---------------------------------------------------------- Marketing site */}
          <Route element={<PublicLayout />}>
            <Route path="/search" element={<TutorSearchPage />} />
            <Route path="/tutors/:tutorId" element={<TutorProfilePage />} />
            <Route path="/courses" element={<PublicCoursesPage />} />
            <Route path="/courses/:courseId" element={<PublicCourseDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/trust-safety" element={<TrustSafetyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
          </Route>

          {/* ---------------------------------------------------------- Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* ------------------------------------------------- Email-linked standalone pages */}
          <Route path="/parent-link/confirm" element={<ParentLinkConfirmPage />} />

          {/* ---------------------------------------------------------- Student portal */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<DashboardLayout navItems={studentNavItems} portalLabel="Student Portal" />}>
              <Route path="/student" element={<StudentDashboardPage />} />
              <Route path="/student/bookings" element={<BookingsListPage />} />
              <Route path="/student/bookings/:bookingId" element={<BookingDetailPage />} />
              <Route path="/student/bookings/:bookingId/pay" element={<BookingPaymentPage />} />
              <Route path="/student/courses" element={<StudentCoursesPage />} />
              <Route path="/student/courses/enroll/:enrollmentId/pay" element={<EnrollmentPaymentPage />} />
              <Route path="/student/wallet" element={<WalletPage />} />
              <Route path="/student/chat" element={<ChatPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
            </Route>
          </Route>

          {/* ---------------------------------------------------------- Tutor portal */}
          <Route element={<ProtectedRoute allowedRoles={["tutor"]} />}>
            <Route element={<DashboardLayout navItems={tutorNavItems} portalLabel="Tutor Portal" />}>
              <Route path="/tutor" element={<TutorDashboardPage />} />
              <Route path="/tutor/bookings" element={<BookingsListPage />} />
              <Route path="/tutor/bookings/:bookingId" element={<BookingDetailPage />} />
              <Route path="/tutor/availability" element={<AvailabilityPage />} />
              <Route path="/tutor/courses" element={<TutorCoursesPage />} />
              <Route path="/tutor/courses/:courseId" element={<TutorCourseDetailPage />} />
              <Route path="/tutor/verification" element={<VerificationPage />} />
              <Route path="/tutor/earnings" element={<WalletPage heading="Earnings & wallet" />} />
              <Route path="/tutor/chat" element={<ChatPage />} />
              <Route path="/tutor/profile" element={<TutorProfileSettingsPage />} />
            </Route>
          </Route>

          {/* ---------------------------------------------------------- Parent portal */}
          <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
            <Route element={<DashboardLayout navItems={parentNavItems} portalLabel="Parent Portal" />}>
              <Route path="/parent" element={<ParentDashboardPage />} />
              <Route path="/parent/children" element={<ParentChildrenPage />} />
              <Route path="/parent/bookings" element={<ParentBookingsPage />} />
              <Route path="/parent/progress" element={<ParentProgressPage />} />
              <Route path="/parent/payments" element={<ParentPaymentsPage />} />
            </Route>
          </Route>

          {/* ---------------------------------------------------------- Institute portal */}
          <Route element={<ProtectedRoute allowedRoles={["institute_admin"]} />}>
            <Route element={<DashboardLayout navItems={instituteNavItems} portalLabel="Institute Portal" />}>
              <Route path="/institute" element={<InstituteDashboardPage />} />
              <Route path="/institute/tutors" element={<InstituteTutorsPage />} />
              <Route path="/institute/students" element={<InstituteStudentsPage />} />
              <Route path="/institute/courses" element={<PlaceholderPage title="Courses" />} />
              <Route path="/institute/profile" element={<InstituteProfileSettingsPage />} />
            </Route>
          </Route>

          {/* ---------------------------------------------------------- Admin portal */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout navItems={adminNavItems} portalLabel="Admin Portal" />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/verifications" element={<VerificationQueuePage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              <Route path="/admin/master-data" element={<AdminMasterDataPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
