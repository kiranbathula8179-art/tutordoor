import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AmbientWash } from "@/components/ui/Surface";
import { useLandingTutorPool } from "@/features/landing/v3/useTutorPool";
import { getSubjects } from "@/features/tutors/api";
import { DURATION, EASE_OUT, motionSafe, riseInit } from "@/lib/motion/tokens";

/**
 * Advanced search — the full filter surface, one hop below the hero's quick
 * search. Submits to /search with the exact param contract TutorSearchPage.tsx
 * reads (q, subject_id, teaching_mode, min_price, max_price, min_rating) —
 * no city/distance fields, since the destination page has no UI for them.
 */
export function AdvancedSearchV3() {
  const navigate = useNavigate();
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });
  const { data: pool } = useLandingTutorPool();

  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [mode, setMode] = useState<"" | "online" | "offline">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (subjectId) params.set("subject_id", subjectId);
    if (mode) params.set("teaching_mode", mode);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (minRating) params.set("min_rating", minRating);
    const suffix = params.toString();
    navigate(suffix ? `/search?${suffix}` : "/search");
  };

  const headline =
    pool && subjects.length > 0
      ? `Search ${pool.count}+ verified tutors across ${subjects.length} subjects`
      : "Search verified tutors by subject, price, and rating";

  return (
    <section className="container-page relative -mt-10 pb-4 sm:-mt-14 sm:pb-8">
      <AmbientWash tones={["blue"]} />
      <motion.div
        initial={riseInit(20)}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={motionSafe({ duration: DURATION.slow, ease: EASE_OUT })}
      >
        <Card className="relative overflow-hidden rounded-3xl border-line/60 bg-white shadow-dialog">
          {/* A single confident accent edge — the search card reads as the product's centerpiece, not another panel. */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-primary-light to-secondary" />
          <CardBody className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-primary">
              <SlidersHorizontal className="h-4 w-4" /> Advanced search
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy sm:text-[1.75rem]">{headline}</h2>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Input
                label="What do you want to learn?"
                placeholder="Subject, tutor name, or headline"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                leadingIcon={<Search className="h-4 w-4" />}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label="Subject"
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  options={[
                    { value: "", label: "Any subject" },
                    ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
                  ]}
                />
                <Select
                  label="Teaching mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "" | "online" | "offline")}
                  options={[
                    { value: "", label: "Any mode" },
                    { value: "online", label: "Online" },
                    { value: "offline", label: "In-person" },
                  ]}
                />
                <Input
                  type="number"
                  label="Min price (₹/hr)"
                  placeholder="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />
                <Input
                  type="number"
                  label="Max price (₹/hr)"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-xs">
                  <Select
                    label="Minimum rating"
                    value={minRating}
                    onChange={(event) => setMinRating(event.target.value)}
                    options={[
                      { value: "", label: "Any rating" },
                      { value: "4.5", label: "4.5+ stars" },
                      { value: "4", label: "4.0+ stars" },
                      { value: "3.5", label: "3.5+ stars" },
                    ]}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto">
                  <Search className="h-4 w-4" /> Search tutors
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </section>
  );
}
