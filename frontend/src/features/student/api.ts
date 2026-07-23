import { apiClient } from "@/lib/api-client";
import type { StudentProfile, User } from "@/types";

export interface StudentProfilePayload {
  date_of_birth?: string | null;
  grade_level?: string;
  school_name?: string;
  learning_goals?: string;
  preferred_learning_mode?: string;
  city?: string;
  state?: string;
  country?: string;
}

export async function getMyStudentProfile(): Promise<StudentProfile> {
  const { data } = await apiClient.get<{ profile: StudentProfile }>("/students/me/profile/");
  return data.profile;
}

export async function createMyStudentProfile(payload: StudentProfilePayload): Promise<StudentProfile> {
  const { data } = await apiClient.post<{ profile: StudentProfile }>("/students/me/profile/", payload);
  return data.profile;
}

export async function updateMyStudentProfile(payload: StudentProfilePayload): Promise<StudentProfile> {
  const { data } = await apiClient.patch<{ profile: StudentProfile }>("/students/me/profile/", payload);
  return data.profile;
}

export async function updateMyAccount(payload: { first_name?: string; last_name?: string }): Promise<User> {
  const { data } = await apiClient.patch<{ user: User }>("/users/me/", payload);
  return data.user;
}

export async function changeMyPassword(payload: { old_password: string; new_password: string }): Promise<void> {
  await apiClient.post("/users/password/change/", payload);
}
