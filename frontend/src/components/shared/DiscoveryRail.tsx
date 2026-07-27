import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarRating } from "@/components/shared/StarRating";
import { searchTutors } from "@/features/tutors/api";
import { listPublishedCourses } from "@/features/courses/api";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { formatCurrency } from "@/lib/utils";

/**
 * A horizontally-scrollable rail of real, already-fetched content — the one
 * reusable "discovery" primitive in the app. Content is supplied by the
 * caller via `items`; this component never fetches or invents data itself.
 * Pair it with `usePopularTutors`/`useNewCourses` below, which wrap the
 * existing public search/list endpoints — no new API surface.
 */
export interface DiscoveryItem {
  id: string;
  title: string;
  subtitle?: string;
  to: string;
  avatarSrc?: string | null;
  avatarFirstName?: string;
  avatarLastName?: string;
  meta?: ReactNode;
}

export function DiscoveryRail({
  title,
  items,
  isLoading,
}: {
  title: string;
  items: DiscoveryItem[];
  isLoading?: boolean;
}) {
  const still = prefersReducedMotion();

  if (!isLoading && items.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-left text-sm font-semibold text-navy">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-2" role="list">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-56 shrink-0 rounded-card" />
            ))
          : (
              <motion.div
                initial={still ? false : "hidden"}
                animate="show"
                variants={staggerContainer}
                className="contents"
              >
                {items.map((item) => (
                  <motion.div key={item.id} variants={staggerItem} role="listitem" className="shrink-0">
                    <Link
                      to={item.to}
                      className="flex w-56 items-center gap-3 rounded-card border border-line bg-canvas p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {(item.avatarFirstName || item.avatarSrc !== undefined) && (
                        <Avatar
                          src={item.avatarSrc}
                          firstName={item.avatarFirstName ?? ""}
                          lastName={item.avatarLastName ?? ""}
                          size="md"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{item.title}</p>
                        {item.subtitle && <p className="truncate text-xs text-slate-500">{item.subtitle}</p>}
                        {item.meta && <div className="mt-1">{item.meta}</div>}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
      </div>
    </div>
  );
}

/**
 * Real, already-public data only — wraps the existing tutor-search endpoint
 * with no filters, which genuinely orders by featured/rating/sessions
 * (verified tutors accepting students). No new endpoint, no fabricated
 * "popularity" score.
 */
export function usePopularTutors(limit = 6) {
  const query = useQuery({
    queryKey: ["discovery-popular-tutors"],
    queryFn: () => searchTutors({}),
    staleTime: 5 * 60 * 1000,
  });

  const items: DiscoveryItem[] = (query.data?.results ?? []).slice(0, limit).map((tutor) => ({
    id: tutor.id,
    title: tutor.user.full_name,
    subtitle: tutor.headline || undefined,
    to: `/tutors/${tutor.id}`,
    avatarSrc: tutor.user.avatar,
    avatarFirstName: tutor.user.first_name,
    avatarLastName: tutor.user.last_name,
    meta: <StarRating rating={Number(tutor.rating_average)} count={tutor.rating_count} size="sm" />,
  }));

  return { items, isLoading: query.isLoading };
}

/**
 * Real, already-public data only — wraps the existing published-courses
 * endpoint with no filters, which genuinely orders by `-created_at`.
 * Presented honestly as "new," never as "trending" (no popularity signal
 * is exposed to non-admin callers anywhere in the backend).
 */
export function useNewCourses(limit = 6) {
  const query = useQuery({
    queryKey: ["discovery-new-courses"],
    queryFn: () => listPublishedCourses({}),
    staleTime: 5 * 60 * 1000,
  });

  const items: DiscoveryItem[] = (query.data?.results ?? []).slice(0, limit).map((course) => ({
    id: course.id,
    title: course.title,
    subtitle: `${course.subject.name} · ${course.tutor.user.full_name}`,
    to: `/courses/${course.id}`,
    meta: <span className="text-xs font-semibold text-primary">{formatCurrency(course.price, course.currency)}</span>,
  }));

  return { items, isLoading: query.isLoading };
}
