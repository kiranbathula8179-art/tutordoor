import { apiClient } from "@/lib/api-client";
import type {
  AvailabilityException,
  AvailableSlot,
  PaginatedResponse,
  Subject,
  SubjectCategory,
  TutorProfile,
  VerificationDocument,
  WeeklyAvailabilitySlot,
} from "@/types";

export interface TutorSearchParams {
  subject_id?: string;
  query?: string;
  teaching_mode?: "online" | "offline";
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  city?: string;
  latitude?: number;
  longitude?: number;
  max_distance_km?: number;
  page?: number;
}

export async function searchTutors(params: TutorSearchParams): Promise<PaginatedResponse<TutorProfile>> {
  const { data } = await apiClient.get<PaginatedResponse<TutorProfile>>("/tutors/search/", { params });
  return data;
}

export async function getTutorById(tutorId: string): Promise<TutorProfile> {
  const { data } = await apiClient.get<{ profile: TutorProfile }>(`/tutors/${tutorId}/`);
  return data.profile;
}

export async function getSubjectCategories(): Promise<SubjectCategory[]> {
  const { data } = await apiClient.get<{ results: SubjectCategory[] }>("/tutors/subjects/categories/");
  return data.results;
}

export async function getSubjects(categoryId?: string): Promise<Subject[]> {
  const { data } = await apiClient.get<{ results: Subject[] }>("/tutors/subjects/", {
    params: categoryId ? { category_id: categoryId } : undefined,
  });
  return data.results;
}

export async function getTutorAvailableSlots(
  tutorId: string,
  params: { start_date: string; end_date: string; slot_duration_minutes?: number }
): Promise<AvailableSlot[]> {
  const { data } = await apiClient.get<{ results: AvailableSlot[] }>(`/tutors/${tutorId}/available-slots/`, {
    params,
  });
  return data.results;
}

// ---------------------------------------------------------------------------
// Authenticated tutor self-management ("me") endpoints
// ---------------------------------------------------------------------------

export interface TutorProfilePayload {
  headline?: string;
  bio?: string;
  education?: string;
  experience_years?: number;
  hourly_rate: string | number;
  currency?: string;
  teaching_mode?: "online" | "offline" | "both";
  languages?: string[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  travel_radius_km?: number;
  subjects?: { subject_id: string; expertise_level: string; years_experience: number }[];
}

export async function getMyTutorProfile(): Promise<TutorProfile> {
  const { data } = await apiClient.get<{ profile: TutorProfile }>("/tutors/me/profile/");
  return data.profile;
}

export async function createMyTutorProfile(payload: TutorProfilePayload): Promise<TutorProfile> {
  const { data } = await apiClient.post<{ profile: TutorProfile }>("/tutors/me/profile/", payload);
  return data.profile;
}

export async function updateMyTutorProfile(payload: Partial<TutorProfilePayload>): Promise<TutorProfile> {
  const { data } = await apiClient.patch<{ profile: TutorProfile }>("/tutors/me/profile/", payload);
  return data.profile;
}

export async function getMyWeeklyAvailability(): Promise<WeeklyAvailabilitySlot[]> {
  const { data } = await apiClient.get<{ results: WeeklyAvailabilitySlot[] }>("/tutors/me/availability/weekly/");
  return data.results;
}

/** Full replace of the recurring weekly template. Times as "HH:MM". */
export async function setMyWeeklyAvailability(
  slots: { day_of_week: number; start_time: string; end_time: string }[]
): Promise<WeeklyAvailabilitySlot[]> {
  const { data } = await apiClient.put<{ results: WeeklyAvailabilitySlot[] }>("/tutors/me/availability/weekly/", {
    slots,
  });
  return data.results;
}

export async function listMyAvailabilityExceptions(): Promise<AvailabilityException[]> {
  const { data } = await apiClient.get<{ results: AvailabilityException[] }>("/tutors/me/availability/exceptions/");
  return data.results;
}

export async function addAvailabilityException(payload: {
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}): Promise<AvailabilityException> {
  const { data } = await apiClient.post<{ exception: AvailabilityException }>(
    "/tutors/me/availability/exceptions/",
    payload
  );
  return data.exception;
}

export async function removeAvailabilityException(exceptionId: string): Promise<void> {
  await apiClient.delete(`/tutors/me/availability/exceptions/${exceptionId}/`);
}

export async function listMyVerificationDocuments(): Promise<VerificationDocument[]> {
  const { data } = await apiClient.get<{ results: VerificationDocument[] }>("/tutors/me/documents/");
  return data.results;
}

export async function uploadVerificationDocument(payload: { document_type: string; file: File }): Promise<VerificationDocument> {
  const formData = new FormData();
  formData.append("document_type", payload.document_type);
  formData.append("file", payload.file);
  const { data } = await apiClient.post<{ document: VerificationDocument }>("/tutors/me/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.document;
}
