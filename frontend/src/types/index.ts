// -----------------------------------------------------------------------
// These mirror the DRF serializer field names (snake_case) exactly, so the
// API layer needs no request/response transformation step.
// -----------------------------------------------------------------------

export type UserRole = "student" | "tutor" | "parent" | "institute_admin" | "admin";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  avatar: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  referral_code: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface SubjectCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: SubjectCategory;
}

export type ExpertiseLevel = "beginner" | "intermediate" | "advanced" | "all_levels";
export type TeachingMode = "online" | "offline" | "both";
export type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface TutorSubject {
  id: string;
  subject: Subject;
  expertise_level: ExpertiseLevel;
  years_experience: number;
}

export interface TutorProfile {
  id: string;
  user: User;
  headline: string;
  bio: string;
  education: string;
  experience_years: number;
  hourly_rate: string;
  currency: string;
  teaching_mode: TeachingMode;
  languages: string[];
  intro_video_url: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  travel_radius_km: number;
  verification_status: VerificationStatus;
  is_verified: boolean;
  rejection_reason: string;
  rating_average: string;
  rating_count: number;
  total_sessions_completed: number;
  response_time_minutes: number;
  is_featured: boolean;
  is_accepting_students: boolean;
  tutor_subjects: TutorSubject[];
  distance_km?: number;
  created_at: string;
}

export type GradeLevel =
  | "primary"
  | "middle"
  | "secondary"
  | "senior_secondary"
  | "undergraduate"
  | "graduate"
  | "professional"
  | "other";

export interface StudentProfile {
  id: string;
  user: User;
  date_of_birth: string | null;
  grade_level: GradeLevel;
  school_name: string;
  learning_goals: string;
  preferred_learning_mode: TeachingMode;
  city: string;
  state: string;
  country: string;
  subject_interests: { id: string; subject: Subject; current_level: ExpertiseLevel }[];
  total_sessions_completed: number;
  total_hours_learned: string;
  created_at: string;
}

export interface ParentProfile {
  id: string;
  user: User;
  occupation: string;
  city: string;
  preferred_contact_method: "email" | "sms" | "whatsapp";
  receives_progress_reports: boolean;
}

export interface ParentStudentLink {
  id: string;
  student: StudentProfile;
  relationship: "father" | "mother" | "guardian" | "other";
  status: "pending" | "active" | "revoked";
  can_manage_bookings: boolean;
  can_manage_payments: boolean;
  can_view_progress: boolean;
  confirmed_at: string | null;
}

export interface InstituteProfile {
  id: string;
  user: User;
  institute_name: string;
  registration_number: string;
  description: string;
  logo: string | null;
  website: string;
  established_year: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  verification_status: VerificationStatus;
  is_verified: boolean;
  rejection_reason: string;
  rating_average: string;
  rating_count: number;
  created_at: string;
}

export type BookingType = "demo" | "regular" | "institute_class";
export type BookingMode = "online" | "offline";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus = "not_required" | "pending" | "paid" | "refunded" | "partially_refunded";

export interface Booking {
  id: string;
  student: StudentProfile;
  tutor: TutorProfile;
  subject: Subject | null;
  booking_type: BookingType;
  mode: BookingMode;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price: string;
  currency: string;
  payment_status: PaymentStatus;
  location: string;
  student_notes: string;
  tutor_notes: string;
  is_demo: boolean;
  cancellation_reason: string;
  cancelled_at: string | null;
  is_late_cancellation: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface WeeklyAvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface AvailableSlot {
  start: string;
  end: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string;
}

export type DocumentType =
  | "government_id"
  | "degree_certificate"
  | "experience_letter"
  | "police_verification"
  | "address_proof";

export interface VerificationDocument {
  id: string;
  document_type: DocumentType;
  file: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string;
  reviewed_at: string | null;
  created_at: string;
}

export type CourseStatus = "draft" | "published" | "archived";

export interface CourseSession {
  id: string;
  session_number: number;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  recording_url: string;
}

export interface Course {
  id: string;
  tutor: TutorProfile;
  subject: Subject;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  level: ExpertiseLevel;
  mode: TeachingMode;
  total_sessions: number;
  duration_weeks: number;
  max_students: number;
  price: string;
  currency: string;
  status: CourseStatus;
  start_date: string | null;
  end_date: string | null;
  sessions: CourseSession[];
  enrolled_count: number;
  seats_available: number;
  created_at: string;
}

export type EnrollmentStatus = "pending_payment" | "active" | "completed" | "dropped";

export interface CourseEnrollment {
  id: string;
  course: Course;
  student: StudentProfile;
  status: EnrollmentStatus;
  progress_percent: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface Assignment {
  id: string;
  course: string;
  session: string | null;
  title: string;
  instructions: string;
  attachment: string | null;
  max_score: number;
  due_at: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment: string;
  student: StudentProfile;
  text_answer: string;
  attachment: string | null;
  submitted_at: string;
  status: "submitted" | "late" | "graded";
  score: number | null;
  feedback: string;
  graded_at: string | null;
}

export interface ProgressReport {
  total_sessions: number;
  attended_sessions: number;
  attendance_rate_percent: number | null;
  total_assignments: number;
  graded_assignments: number;
  assignment_completion_percent: number | null;
  overall_progress_percent: number;
}

export interface Wallet {
  id: string;
  balance: string;
  currency: string;
  is_frozen: boolean;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  transaction_type: "credit" | "debit";
  category: string;
  amount: string;
  balance_after: string;
  description: string;
  created_at: string;
}

export type PaymentGateway = "razorpay" | "stripe" | "wallet";
export type PaymentPurpose = "booking" | "course_enrollment" | "subscription" | "wallet_topup";

export interface Payment {
  id: string;
  gateway: PaymentGateway;
  purpose: PaymentPurpose;
  reference_id: string;
  amount: string;
  discount_amount: string;
  net_payable: string;
  currency: string;
  status: "created" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  gateway_order_id: string;
  paid_at: string | null;
  failure_reason: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  target_role: UserRole;
  description: string;
  price: string;
  currency: string;
  billing_interval: "monthly" | "quarterly" | "yearly";
  features: string[];
  max_bookings_per_month: number | null;
  commission_discount_percent: string;
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: "pending_payment" | "active" | "cancelled" | "expired" | "past_due";
  started_at: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export type NotificationType =
  | "booking_update"
  | "payment_update"
  | "course_update"
  | "chat_message"
  | "verification_update"
  | "referral"
  | "system"
  | "promotional";

export interface AppNotification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  related_booking_id: string | null;
  related_course_id: string | null;
  is_active: boolean;
  last_message: Message | null;
  updated_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: User;
  message_type: "text" | "image" | "file" | "system";
  content: string;
  attachment: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
}

export interface TutorReview {
  id: string;
  booking: string;
  student: StudentProfile;
  tutor: string;
  rating: number;
  comment: string;
  tutor_response: string;
  tutor_response_at: string | null;
  created_at: string;
}

export interface CourseReview {
  id: string;
  enrollment: string;
  student: StudentProfile;
  course: string;
  rating: number;
  comment: string;
  tutor_response: string;
  tutor_response_at: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------
// Envelope types matching apps.core response shapes
// -----------------------------------------------------------------------

export interface ApiSuccessEnvelope<T> {
  success: true;
  message?: string;
  [key: string]: unknown;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: true;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiErrorEnvelope {
  success: false;
  code: string;
  message: string;
  errors?: Record<string, string[]> | string[] | null;
}
