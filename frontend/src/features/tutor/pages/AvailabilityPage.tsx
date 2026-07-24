import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { AlertCircle, CalendarOff, CalendarPlus, Check, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { RequireTutorProfile } from "@/components/shared/RequireTutorProfile";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  addAvailabilityException,
  getMyTutorProfile,
  getMyWeeklyAvailability,
  listMyAvailabilityExceptions,
  removeAvailabilityException,
  setMyWeeklyAvailability,
} from "@/features/tutors/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DraftSlot {
  start_time: string; // "HH:MM"
  end_time: string;
}

type WeeklyDraft = Record<number, DraftSlot[]>;

const emptyWeek = (): WeeklyDraft => Object.fromEntries(DAY_NAMES.map((_, index) => [index, []])) as WeeklyDraft;

export function AvailabilityPage() {
  const queryClient = useQueryClient();
  const still = prefersReducedMotion();

  const { isError: profileFetchFailed, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["my-tutor-profile"],
    queryFn: getMyTutorProfile,
    retry: false,
  });

  // A missing profile (404) means "not set up yet"; anything else is a real
  // error and must not be presented as if there's simply no profile.
  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;
  const profileReady = !profileFetchFailed;

  const {
    data: savedSlots,
    isLoading: weeklyLoading,
    isError: weeklyError,
    refetch: refetchWeekly,
  } = useQuery({
    queryKey: ["my-weekly-availability"],
    queryFn: getMyWeeklyAvailability,
    enabled: profileReady,
    retry: false,
  });

  const {
    data: exceptions = [],
    isLoading: exceptionsLoading,
    isError: exceptionsError,
    refetch: refetchExceptions,
  } = useQuery({
    queryKey: ["my-availability-exceptions"],
    queryFn: listMyAvailabilityExceptions,
    enabled: profileReady,
    retry: false,
  });

  const [week, setWeek] = useState<WeeklyDraft>(emptyWeek());
  const [isDirty, setIsDirty] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);

  // Seed the editable draft from the server template once loaded.
  useEffect(() => {
    if (!savedSlots) return;
    const draft = emptyWeek();
    for (const slot of savedSlots) {
      draft[slot.day_of_week].push({
        start_time: slot.start_time.slice(0, 5),
        end_time: slot.end_time.slice(0, 5),
      });
    }
    setWeek(draft);
    setIsDirty(false);
  }, [savedSlots]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const flat = Object.entries(week).flatMap(([day, slots]) =>
        slots.map((slot) => ({ day_of_week: Number(day), start_time: slot.start_time, end_time: slot.end_time }))
      );
      return setMyWeeklyAvailability(flat);
    },
    onSuccess: () => {
      toast.success("Weekly schedule saved.");
      queryClient.invalidateQueries({ queryKey: ["my-weekly-availability"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeExceptionMutation = useMutation({
    mutationFn: removeAvailabilityException,
    onSuccess: () => {
      toast.success("Exception removed.");
      queryClient.invalidateQueries({ queryKey: ["my-availability-exceptions"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateSlot = (day: number, index: number, field: keyof DraftSlot, value: string) => {
    setWeek((current) => {
      const next = { ...current, [day]: current[day].map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)) };
      return next;
    });
    setIsDirty(true);
  };

  const addSlot = (day: number) => {
    setWeek((current) => ({ ...current, [day]: [...current[day], { start_time: "16:00", end_time: "18:00" }] }));
    setIsDirty(true);
  };

  const removeSlot = (day: number, index: number) => {
    setWeek((current) => ({ ...current, [day]: current[day].filter((_, i) => i !== index) }));
    setIsDirty(true);
  };

  if (noProfile || profileHasError) {
    return (
      <div>
        <PageHeader title="Availability" />
        <RequireTutorProfile
          icon={CalendarPlus}
          title="Create your tutor profile first"
          description="Your availability, verification, and bookings all hang off your tutor profile."
          hasError={profileHasError}
          onRetry={() => refetchProfile()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Students can only book inside these windows."
        actions={
          <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending} disabled={!isDirty}>
            <Save className="h-4 w-4" /> Save schedule
          </Button>
        }
      />

      {/* ------------------------------------------------ Weekly template */}
      {weeklyLoading ? (
        <SectionLoader />
      ) : weeklyError ? (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <AlertCircle className="h-4 w-4 text-danger" /> Couldn't load your weekly schedule.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchWeekly()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Week-at-a-glance — a real, computed summary of the draft below, not a
              separate data model or a different editing surface. */}
          <div className="mt-6 flex gap-2" role="img" aria-label="Week availability summary">
            {DAY_ABBR.map((abbr, day) => {
              const hasSlots = week[day].length > 0;
              return (
                <div
                  key={day}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold",
                    hasSlots ? "border-success/30 bg-success-subtle text-success-dark" : "border-line bg-canvas text-slate-400"
                  )}
                >
                  {abbr}
                  <span className={cn("h-1.5 w-1.5 rounded-full", hasSlots ? "bg-success" : "bg-line")} />
                </div>
              );
            })}
          </div>

          <motion.div
            initial={still ? false : "hidden"}
            animate="show"
            variants={staggerContainer}
            className="mt-4 space-y-3"
          >
          {DAY_NAMES.map((dayName, day) => (
            <motion.div key={day} variants={staggerItem}>
            <Card>
              <CardBody className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <div className="w-28 shrink-0 pt-2">
                  <p className="font-semibold text-navy">{dayName}</p>
                  {week[day].length === 0 && <p className="text-xs text-slate-400">Unavailable</p>}
                </div>

                <div className="flex-1 space-y-2">
                  {week[day].map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start_time}
                        onChange={(event) => updateSlot(day, index, "start_time", event.target.value)}
                        aria-label={`${dayName} slot ${index + 1} start`}
                        className="max-w-[8.5rem]"
                      />
                      <span className="text-slate-400">–</span>
                      <Input
                        type="time"
                        value={slot.end_time}
                        onChange={(event) => updateSlot(day, index, "end_time", event.target.value)}
                        aria-label={`${dayName} slot ${index + 1} end`}
                        className="max-w-[8.5rem]"
                      />
                      <button
                        onClick={() => removeSlot(day, index)}
                        aria-label="Remove slot"
                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-danger-subtle hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSlot(day)}
                    className="flex items-center gap-1.5 text-sm font-medium text-danger hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add time slot
                  </button>
                </div>
              </CardBody>
            </Card>
            </motion.div>
          ))}
          </motion.div>
        </>
      )}

      {/* ------------------------------------------------ Exceptions */}
      <div className="mt-10 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Date exceptions</h2>
          <p className="text-sm text-slate-500">Block a day off, or open a one-off extra window.</p>
        </div>
        <Button variant="outline" onClick={() => setExceptionModalOpen(true)}>
          <CalendarOff className="h-4 w-4" /> Add exception
        </Button>
      </div>

      <div className="mt-3">
        {exceptionsLoading ? (
          <SectionLoader />
        ) : exceptionsError ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <AlertCircle className="h-4 w-4 text-danger" /> Couldn't load exceptions.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchExceptions()}>
              Retry
            </Button>
          </div>
        ) : exceptions.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-slate-500">
            No upcoming exceptions.
          </p>
        ) : (
          <Card>
            <div className="divide-y divide-line">
              {exceptions.map((exception) => (
                <div key={exception.id} className="flex items-center gap-4 px-5 py-3.5">
                  <Badge tone={exception.is_available ? "success" : "danger"}>
                    {exception.is_available ? "Extra slot" : "Blocked"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">
                      {formatDate(exception.date)}
                      {exception.is_available && exception.start_time && (
                        <span className="ml-2 font-mono text-xs font-normal text-slate-600">
                          {exception.start_time.slice(0, 5)}–{exception.end_time?.slice(0, 5)}
                        </span>
                      )}
                    </p>
                    {exception.reason && <p className="truncate text-xs text-slate-400">{exception.reason}</p>}
                  </div>
                  <button
                    onClick={() => removeExceptionMutation.mutate(exception.id)}
                    aria-label="Remove exception"
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-danger-subtle hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <AddExceptionModal isOpen={exceptionModalOpen} onClose={() => setExceptionModalOpen(false)} />
    </div>
  );
}

function AddExceptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<"blocked" | "extra">("blocked");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [reason, setReason] = useState("");

  const addMutation = useMutation({
    mutationFn: () =>
      addAvailabilityException({
        date,
        is_available: kind === "extra",
        start_time: kind === "extra" ? startTime : undefined,
        end_time: kind === "extra" ? endTime : undefined,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success("Exception added.");
      queryClient.invalidateQueries({ queryKey: ["my-availability-exceptions"] });
      onClose();
      setDate("");
      setReason("");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a date exception" size="sm">
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Exception type">
        <button
          type="button"
          role="radio"
          aria-checked={kind === "blocked"}
          onClick={() => setKind("blocked")}
          className={cn(
            "relative rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            kind === "blocked" ? "border-primary bg-primary-subtle shadow-soft" : "border-line hover:border-navy/25"
          )}
        >
          {kind === "blocked" && (
            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
          )}
          <p className="text-sm font-semibold text-navy">Block a day</p>
          <p className="mt-0.5 text-xs text-slate-400">Leave, holiday, exam duty</p>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={kind === "extra"}
          onClick={() => setKind("extra")}
          className={cn(
            "relative rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            kind === "extra" ? "border-primary bg-primary-subtle shadow-soft" : "border-line hover:border-navy/25"
          )}
        >
          {kind === "extra" && (
            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
          )}
          <p className="text-sm font-semibold text-navy">Extra window</p>
          <p className="mt-0.5 text-xs text-slate-400">One-off open slot</p>
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        {kind === "extra" && (
          <div className="flex items-center gap-2">
            <Input label="From" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            <Input label="To" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </div>
        )}
        <Input label="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>

      <Button className="mt-5 w-full" onClick={() => addMutation.mutate()} isLoading={addMutation.isPending} disabled={!date}>
        Add exception
      </Button>
    </Modal>
  );
}
