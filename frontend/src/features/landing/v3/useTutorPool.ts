import { useQuery } from "@tanstack/react-query";

import { searchTutors } from "@/features/tutors/api";

/**
 * One shared pool of tutors for the landing page, instead of Hero and
 * FeaturedTutors each running their own filtered query. The public search
 * endpoint already orders unfiltered results `-is_featured, -rating_average,
 * -total_sessions_completed` (apps/tutors/services/search_service.py), so the
 * "best tutors first" ordering is real API behavior, not a client re-sort.
 *
 * A single shared React Query key means Hero/FeaturedTutors/Testimonials all
 * dedupe to one network request regardless of mount order, and slicing the
 * same list differently keeps every section showing distinct people.
 */
export function useLandingTutorPool() {
  return useQuery({
    queryKey: ["landing-tutor-pool"],
    queryFn: () => searchTutors({ page: 1 }),
  });
}
