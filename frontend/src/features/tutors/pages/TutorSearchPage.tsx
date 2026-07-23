import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Paginator } from "@/features/admin/components/Paginator";
import { getSubjects, searchTutors } from "@/features/tutors/api";
import { TutorResultCard } from "@/features/tutors/components/TutorResultCard";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn } from "@/lib/utils";

/**
 * Tutor Search — V3 premium redesign. Gradient hero, quick-filter chips,
 * sticky filter card, enriched result cards, skeletons, empty state, and
 * pagination. The URL param contract is byte-identical across four
 * redesigns now: q, subject_id, teaching_mode, min_price, max_price,
 * min_rating (+ page) — every deep link keeps working.
 */

const QUICK_FILTERS = [
  { label: "Top rated", key: "min_rating", value: "4.5" },
  { label: "Online", key: "teaching_mode", value: "online" },
  { label: "In-person", key: "teaching_mode", value: "offline" },
  { label: "Under ₹500/hr", key: "max_price", value: "500" },
] as const;

export function TutorSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const still = prefersReducedMotion();

  const query = searchParams.get("q") ?? "";
  const subjectId = searchParams.get("subject_id") ?? "";
  const mode = searchParams.get("teaching_mode") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const minRating = searchParams.get("min_rating") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["tutor-search", Object.fromEntries(searchParams)],
    queryFn: () =>
      searchTutors({
        query: query || undefined,
        subject_id: subjectId || undefined,
        teaching_mode: (mode as "online" | "offline") || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        min_rating: minRating ? Number(minRating) : undefined,
        page,
      }),
  });

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // any filter change resets to page 1
    setSearchParams(next);
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const activeFilterCount = [subjectId, mode, minPrice, maxPrice, minRating].filter(Boolean).length;

  const activeChips: Array<{ key: string; label: string }> = [
    subjectId && { key: "subject_id", label: subjects.find((s) => s.id === subjectId)?.name ?? "Subject" },
    mode && { key: "teaching_mode", label: mode === "online" ? "Online" : "In-person" },
    minPrice && { key: "min_price", label: `From ₹${minPrice}` },
    maxPrice && { key: "max_price", label: `Up to ₹${maxPrice}` },
    minRating && { key: "min_rating", label: `${minRating}+ stars` },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const isQuickActive = (key: string, value: string) => searchParams.get(key) === value;

  return (
    <div className="bg-surface">
      {/* ---------------------------------------------- Gradient hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:24px_24px] opacity-40"
        />
        <div className="container-page relative py-12 sm:py-16">
          <motion.div
            initial={still ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Every tutor verified by review
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Find your perfect tutor
            </h1>
            <p className="mt-3 max-w-lg text-blue-100">
              Search by subject, price, and rating — then book straight into real availability.
            </p>

            {/* Search bar */}
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-canvas p-2 pl-4 shadow-dialog">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(event) => updateFilter("q", event.target.value)}
                placeholder="Search by name, subject, or headline…"
                aria-label="Search tutors"
                className="w-full bg-transparent text-navy placeholder:text-slate-400 focus:outline-none"
              />
              <Button className="shrink-0 lg:hidden" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick filter chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_FILTERS.map((chip) => {
                const active = isQuickActive(chip.key, chip.value);
                return (
                  <button
                    key={chip.label}
                    onClick={() => updateFilter(chip.key, active ? "" : chip.value)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                      active
                        ? "bg-canvas text-primary shadow-soft"
                        : "bg-white/15 text-white hover:bg-white/25"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-page py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* -------------------------------------------- Filter rail */}
          <aside className={cn("lg:block", filtersOpen ? "block" : "hidden")}>
            <Card className="sticky top-24">
              <CardBody className="p-5 pt-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-display font-bold text-navy">Filters</h2>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-xs font-semibold text-danger transition-colors hover:text-danger-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                    >
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  <Select
                    label="Subject"
                    value={subjectId}
                    onChange={(event) => updateFilter("subject_id", event.target.value)}
                    options={[
                      { value: "", label: "Any subject" },
                      ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
                    ]}
                  />
                  <Select
                    label="Teaching mode"
                    value={mode}
                    onChange={(event) => updateFilter("teaching_mode", event.target.value)}
                    options={[
                      { value: "", label: "Any mode" },
                      { value: "online", label: "Online" },
                      { value: "offline", label: "In-person" },
                    ]}
                  />
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Price range (₹/hr)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        aria-label="Minimum price per hour"
                        value={minPrice}
                        onChange={(event) => updateFilter("min_price", event.target.value)}
                      />
                      <span className="text-slate-400">–</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        aria-label="Maximum price per hour"
                        value={maxPrice}
                        onChange={(event) => updateFilter("max_price", event.target.value)}
                      />
                    </div>
                  </div>
                  <Select
                    label="Minimum rating"
                    value={minRating}
                    onChange={(event) => updateFilter("min_rating", event.target.value)}
                    options={[
                      { value: "", label: "Any rating" },
                      { value: "4.5", label: "4.5+ stars" },
                      { value: "4", label: "4.0+ stars" },
                      { value: "3.5", label: "3.5+ stars" },
                    ]}
                  />
                </div>
              </CardBody>
            </Card>
          </aside>

          {/* -------------------------------------------- Results */}
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500" aria-live="polite">
                {data
                  ? `${data.count} verified tutor${data.count === 1 ? "" : "s"} found`
                  : "Loading verified tutors…"}
              </p>
              {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => updateFilter(chip.key, "")}
                      className="flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1.5 text-xs font-semibold text-primary-dark transition-colors hover:bg-danger-subtle hover:text-danger-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {chip.label}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading tutors">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-72 rounded-2xl" />
                ))}
              </div>
            ) : isError ? (
              <Card>
                <EmptyState
                  icon={AlertCircle}
                  title="We couldn't load tutors"
                  description="Something went wrong reaching the server. Check your connection and try again."
                  action={
                    <Button variant="outline" onClick={() => refetch()}>
                      Retry
                    </Button>
                  }
                />
              </Card>
            ) : data && data.results.length > 0 ? (
              <>
                <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", isFetching && "opacity-60")}>
                  {data.results.map((tutor, index) => (
                    <motion.div
                      key={tutor.id}
                      initial={still ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: still ? 0 : Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full"
                    >
                      <TutorResultCard tutor={tutor} />
                    </motion.div>
                  ))}
                </div>
                <Paginator
                  currentPage={data.current_page}
                  totalPages={data.total_pages}
                  totalCount={data.count}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <Card>
                <EmptyState
                  icon={SearchX}
                  title="No tutors match these filters"
                  description="Try widening the price range or clearing a filter — there are more tutors than this view suggests."
                  action={
                    activeFilterCount > 0 ? (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear all filters
                      </Button>
                    ) : undefined
                  }
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
