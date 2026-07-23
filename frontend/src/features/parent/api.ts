import { apiClient } from "@/lib/api-client";
import type { CourseEnrollment, ParentProfile, ParentStudentLink } from "@/types";

export async function getMyParentProfile(): Promise<ParentProfile> {
  const { data } = await apiClient.get<{ profile: ParentProfile }>("/parents/me/profile/");
  return data.profile;
}

export async function createMyParentProfile(
  payload: {
    occupation?: string;
    city?: string;
    preferred_contact_method?: "email" | "sms" | "whatsapp";
    receives_progress_reports?: boolean;
  } = {}
): Promise<ParentProfile> {
  const { data } = await apiClient.post<{ profile: ParentProfile }>("/parents/me/profile/", payload);
  return data.profile;
}

export async function listMyChildren(): Promise<ParentStudentLink[]> {
  const { data } = await apiClient.get<{ results: ParentStudentLink[] }>("/parents/me/children/");
  return data.results;
}

export async function inviteChild(payload: {
  student_email: string;
  relationship: string;
}): Promise<ParentStudentLink> {
  const { data } = await apiClient.post<{ link: ParentStudentLink }>("/parents/me/children/", payload);
  return data.link;
}

export async function confirmParentLink(token: string): Promise<ParentStudentLink> {
  const { data } = await apiClient.post<{ link: ParentStudentLink }>("/parents/link/confirm/", { token });
  return data.link;
}

export async function listChildEnrollments(studentId: string): Promise<CourseEnrollment[]> {
  const { data } = await apiClient.get<{ results: CourseEnrollment[] }>(
    `/parents/me/children/${studentId}/enrollments/`
  );
  return data.results;
}
