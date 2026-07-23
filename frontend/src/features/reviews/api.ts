import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, TutorReview } from "@/types";

export interface TutorReviewListParams {
  page?: number;
  page_size?: number;
}

export async function getTutorReviews(
  tutorId: string,
  params?: TutorReviewListParams
): Promise<PaginatedResponse<TutorReview>> {
  const { data } = await apiClient.get<PaginatedResponse<TutorReview>>(`/reviews/tutors/${tutorId}/`, { params });
  return data;
}
