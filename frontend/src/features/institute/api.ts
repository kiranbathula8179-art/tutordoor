import { apiClient } from "@/lib/api-client";
import type { InstituteProfile, StudentProfile, TutorProfile } from "@/types";

export interface InstituteTutorLink {
  id: string;
  tutor: TutorProfile;
  role_title: string;
  status: "pending" | "active" | "removed" | "declined";
  joined_at: string | null;
  created_at: string;
}

export interface InstituteEnrollment {
  id: string;
  student: StudentProfile;
  status: "active" | "completed" | "withdrawn";
  enrolled_at: string;
  notes: string;
}

/** The tutor's view of an institute link — institute nested instead of the tutor. */
export interface TutorInstituteLink {
  id: string;
  institute: { id: string; institute_name: string; city: string; is_verified: boolean };
  role_title: string;
  status: "pending" | "active" | "removed" | "declined";
  joined_at: string | null;
  created_at: string;
}

export interface InstituteProfilePayload {
  institute_name: string;
  registration_number?: string;
  description?: string;
  website?: string;
  established_year?: number | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export async function getMyInstituteProfile(): Promise<InstituteProfile> {
  const { data } = await apiClient.get<{ profile: InstituteProfile }>("/institutes/me/profile/");
  return data.profile;
}

export async function createMyInstituteProfile(payload: InstituteProfilePayload): Promise<InstituteProfile> {
  const { data } = await apiClient.post<{ profile: InstituteProfile }>("/institutes/me/profile/", payload);
  return data.profile;
}

export async function updateMyInstituteProfile(payload: Partial<InstituteProfilePayload>): Promise<InstituteProfile> {
  const { data } = await apiClient.patch<{ profile: InstituteProfile }>("/institutes/me/profile/", payload);
  return data.profile;
}

export async function listInstituteTutors(status?: string): Promise<InstituteTutorLink[]> {
  const { data } = await apiClient.get<{ results: InstituteTutorLink[] }>("/institutes/me/tutors/", {
    params: status ? { status } : undefined,
  });
  return data.results;
}

export async function inviteInstituteTutor(payload: { tutor_id: string; role_title?: string }): Promise<InstituteTutorLink> {
  const { data } = await apiClient.post<{ link: InstituteTutorLink }>("/institutes/me/tutors/", payload);
  return data.link;
}

export async function listInstituteStudents(status?: string): Promise<InstituteEnrollment[]> {
  const { data } = await apiClient.get<{ results: InstituteEnrollment[] }>("/institutes/me/students/", {
    params: status ? { status } : undefined,
  });
  return data.results;
}

export async function enrollInstituteStudent(studentEmail: string): Promise<InstituteEnrollment> {
  const { data } = await apiClient.post<{ enrollment: InstituteEnrollment }>("/institutes/me/students/", {
    student_email: studentEmail,
  });
  return data.enrollment;
}

// ---------------------------------------------------------------------------
// Tutor side
// ---------------------------------------------------------------------------

export async function listMyInstituteInvites(): Promise<TutorInstituteLink[]> {
  const { data } = await apiClient.get<{ results: TutorInstituteLink[] }>("/institutes/tutor/invites/");
  return data.results;
}

export async function respondToInstituteInvite(instituteId: string, accept: boolean): Promise<TutorInstituteLink> {
  const { data } = await apiClient.post<{ link: TutorInstituteLink }>(
    `/institutes/${instituteId}/tutor-invite/respond/`,
    { accept }
  );
  return data.link;
}
