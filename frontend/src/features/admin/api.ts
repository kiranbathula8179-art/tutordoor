import { apiClient } from "@/lib/api-client";
import type { Booking, PaginatedResponse, Payment, TutorProfile, User, VerificationDocument } from "@/types";

export interface AdminVerificationDocument extends VerificationDocument {
  tutor: {
    id: string;
    full_name: string;
    email: string;
    headline: string;
    verification_status: string;
  };
}

export async function listPendingVerificationDocuments(): Promise<AdminVerificationDocument[]> {
  const { data } = await apiClient.get<{ results: AdminVerificationDocument[] }>(
    "/tutors/admin/verifications/pending/"
  );
  return data.results;
}

export async function reviewDocument(
  documentId: string,
  payload: { approve: boolean; notes?: string }
): Promise<VerificationDocument> {
  const { data } = await apiClient.post<{ document: VerificationDocument }>(
    `/tutors/admin/verifications/documents/${documentId}/review/`,
    { approve: payload.approve, notes: payload.notes ?? "" }
  );
  return data.document;
}

export async function approveTutor(tutorId: string): Promise<TutorProfile> {
  const { data } = await apiClient.post<{ profile: TutorProfile }>(`/tutors/admin/verifications/${tutorId}/approve/`);
  return data.profile;
}

export async function rejectTutor(tutorId: string, reason: string): Promise<TutorProfile> {
  const { data } = await apiClient.post<{ profile: TutorProfile }>(`/tutors/admin/verifications/${tutorId}/reject/`, {
    reason,
  });
  return data.profile;
}

// ---------------------------------------------------------------------------
// Reports (analytics)
// ---------------------------------------------------------------------------

export interface TopSubjectRow {
  subject__name: string;
  booking_count: number;
}

export interface RevenueReportRow {
  purpose: string;
  total_amount: string;
  transaction_count: number;
}

export interface DailyMetricsRow {
  date: string;
  total_users: number;
  total_tutors: number;
  total_students: number;
  new_signups: number;
  total_bookings_created: number;
  completed_bookings: number;
  cancelled_bookings: number;
  gross_merchandise_value: string;
  platform_revenue: string;
  active_subscriptions: number;
}

export async function getTopTutors(limit = 10): Promise<TutorProfile[]> {
  const { data } = await apiClient.get<{ results: TutorProfile[] }>("/analytics/admin/top-tutors/", {
    params: { limit },
  });
  return data.results;
}

export async function getTopSubjects(limit = 10): Promise<TopSubjectRow[]> {
  const { data } = await apiClient.get<{ results: TopSubjectRow[] }>("/analytics/admin/top-subjects/", {
    params: { limit },
  });
  return data.results;
}

export async function getRevenueReport(startDate: string, endDate: string): Promise<RevenueReportRow[]> {
  const { data } = await apiClient.get<{ results: RevenueReportRow[] }>("/analytics/admin/revenue-report/", {
    params: { start_date: startDate, end_date: endDate },
  });
  return data.results;
}

export async function getMetricsTrend(startDate: string, endDate: string): Promise<DailyMetricsRow[]> {
  const { data } = await apiClient.get<{ results: DailyMetricsRow[] }>("/analytics/admin/metrics-trend/", {
    params: { start_date: startDate, end_date: endDate },
  });
  return data.results;
}

// ---------------------------------------------------------------------------
// Directory lists (users · bookings · payments · coupons)
// ---------------------------------------------------------------------------

export interface AdminUser extends User {
  is_active: boolean;
  last_login: string | null;
}

export interface AdminPayment extends Payment {
  user_email: string;
  user_name: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "flat";
  discount_value: string;
  max_discount_amount: string | null;
  min_order_amount: string;
  applicable_to: "all" | "booking" | "course" | "subscription";
  valid_from: string;
  valid_until: string;
  usage_limit_total: number | null;
  usage_limit_per_user: number;
  times_used: number;
  is_active: boolean;
}

export async function listAdminUsers(
  params: { role?: string; q?: string; is_active?: string; page?: number } = {}
): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminUser>>("/auth/admin/users/", { params });
  return data;
}

export async function listAdminBookings(
  params: { status?: string; q?: string; page?: number } = {}
): Promise<PaginatedResponse<Booking>> {
  const { data } = await apiClient.get<PaginatedResponse<Booking>>("/bookings/admin/bookings/", { params });
  return data;
}

export async function listAdminPayments(
  params: { status?: string; purpose?: string; q?: string; page?: number } = {}
): Promise<PaginatedResponse<AdminPayment>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminPayment>>("/payments/admin/payments/", { params });
  return data;
}

export async function listAdminCoupons(): Promise<AdminCoupon[]> {
  const { data } = await apiClient.get<{ results: AdminCoupon[] }>("/payments/admin/coupons/");
  return data.results;
}

export type CreateCouponPayload = Omit<AdminCoupon, "id" | "times_used">;

export async function createCoupon(payload: CreateCouponPayload): Promise<AdminCoupon> {
  const { data } = await apiClient.post<{ coupon: AdminCoupon }>("/payments/admin/coupons/", payload);
  return data.coupon;
}

export async function updateCoupon(couponId: string, patch: Partial<CreateCouponPayload>): Promise<AdminCoupon> {
  const { data } = await apiClient.patch<{ coupon: AdminCoupon }>(`/payments/admin/coupons/${couponId}/`, patch);
  return data.coupon;
}
