import { apiClient } from "@/lib/api-client";
import type { Course, CourseEnrollment, PaginatedResponse } from "@/types";

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export async function listPublishedCourses(
  params: { subject_id?: string; tutor_id?: string; level?: string; mode?: string; page?: number } = {}
): Promise<PaginatedResponse<Course>> {
  const { data } = await apiClient.get<PaginatedResponse<Course>>("/courses/", { params });
  return data;
}

export async function getCourse(courseId: string): Promise<Course> {
  const { data } = await apiClient.get<{ course: Course }>(`/courses/${courseId}/`);
  return data.course;
}

// ---------------------------------------------------------------------------
// Tutor management
// ---------------------------------------------------------------------------

export interface SessionScheduleEntry {
  title?: string;
  scheduled_start: string; // ISO datetime
  scheduled_end: string;
}

export interface CreateCoursePayload {
  subject_id: string;
  title: string;
  description?: string;
  level?: string;
  mode?: string;
  total_sessions: number;
  duration_weeks?: number;
  max_students?: number;
  price: string | number;
  start_date?: string;
  end_date?: string;
  session_schedule?: SessionScheduleEntry[];
}

export async function listMyTeachingCourses(status?: string): Promise<Course[]> {
  const { data } = await apiClient.get<{ results: Course[] }>("/courses/me/teaching/", {
    params: status ? { status } : undefined,
  });
  return data.results;
}

export async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  const { data } = await apiClient.post<{ course: Course }>("/courses/", payload);
  return data.course;
}

export async function publishCourse(courseId: string): Promise<Course> {
  const { data } = await apiClient.post<{ course: Course }>(`/courses/${courseId}/publish/`);
  return data.course;
}

export async function addCourseSessions(courseId: string, sessionSchedule: SessionScheduleEntry[]): Promise<Course> {
  const { data } = await apiClient.post<{ course: Course }>(`/courses/${courseId}/sessions/`, {
    session_schedule: sessionSchedule,
  });
  return data.course;
}

export async function listCourseEnrollments(courseId: string): Promise<CourseEnrollment[]> {
  const { data } = await apiClient.get<{ results: CourseEnrollment[] }>(`/courses/${courseId}/enrollments/`);
  return data.results;
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export async function enrollInCourse(courseId: string): Promise<CourseEnrollment> {
  const { data } = await apiClient.post<{ enrollment: CourseEnrollment }>(`/courses/${courseId}/enroll/`);
  return data.enrollment;
}

export async function listMyEnrollments(status?: string): Promise<CourseEnrollment[]> {
  const { data } = await apiClient.get<{ results: CourseEnrollment[] }>("/courses/me/enrollments/", {
    params: status ? { status } : undefined,
  });
  return data.results;
}

export async function dropEnrollment(enrollmentId: string): Promise<void> {
  await apiClient.post(`/courses/enrollments/${enrollmentId}/drop/`);
}

export async function joinCourseSession(sessionId: string): Promise<{ join_url: string }> {
  const { data } = await apiClient.post<{ join_url: string }>(`/courses/sessions/${sessionId}/join/`);
  return data;
}
