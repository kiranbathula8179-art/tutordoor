import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { useMasterData } from "@/lib/master-data";
import { AlertCircle, GraduationCap, MapPin, Plus, Save, Trash2, UserRound, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  createMyTutorProfile,
  getMyTutorProfile,
  getSubjects,
  updateMyTutorProfile,
  type TutorProfilePayload,
} from "@/features/tutors/api";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { getErrorMessage } from "@/lib/utils";

interface SubjectRow {
  subject_id: string;
  expertise_level: string;
  years_experience: number;
}

interface FormState {
  headline: string;
  bio: string;
  education: string;
  experience_years: number;
  hourly_rate: string;
  teaching_mode: "online" | "offline" | "both";
  address: string;
  city: string;
  state: string;
  country: string;
  travel_radius_km: number;
}

const INITIAL_FORM: FormState = {
  headline: "",
  bio: "",
  education: "",
  experience_years: 0,
  hourly_rate: "",
  teaching_mode: "online",
  address: "",
  city: "",
  state: "",
  country: "India",
  travel_radius_km: 10,
};

function SectionHeading({ icon: Icon, children }: { icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  );
}

export function TutorProfileSettingsPage() {
  const queryClient = useQueryClient();
  const { optionsFor } = useMasterData(["skill_level"]);

  const {
    data: profile,
    isLoading,
    isError: profileFetchFailed,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-tutor-profile"],
    queryFn: getMyTutorProfile,
    retry: false,
  });

  // A missing profile (404) means "not created yet"; any other error must
  // block the form instead — saving while noProfile is wrongly true would
  // call createMyTutorProfile against a profile that may already exist.
  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;

  const {
    data: allSubjects = [],
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [languagesInput, setLanguagesInput] = useState("");
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([]);

  // Seed the form once an existing profile loads.
  useEffect(() => {
    if (!profile) return;
    setForm({
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      education: profile.education ?? "",
      experience_years: profile.experience_years ?? 0,
      hourly_rate: profile.hourly_rate ?? "",
      teaching_mode: profile.teaching_mode ?? "online",
      address: profile.address ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      country: profile.country ?? "India",
      travel_radius_km: profile.travel_radius_km ?? 10,
    });
    setLanguagesInput((profile.languages ?? []).join(", "));
    setSubjectRows(
      (profile.tutor_subjects ?? []).map((ts) => ({
        subject_id: ts.subject.id,
        expertise_level: ts.expertise_level,
        years_experience: ts.years_experience,
      }))
    );
  }, [profile]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: TutorProfilePayload = {
        ...form,
        hourly_rate: form.hourly_rate,
        languages: languagesInput
          .split(",")
          .map((language) => language.trim())
          .filter(Boolean),
        subjects: subjectRows.filter((row) => row.subject_id),
      };
      return noProfile ? createMyTutorProfile(payload) : updateMyTutorProfile(payload);
    },
    onSuccess: () => {
      toast.success(noProfile ? "Profile created — you can now set availability." : "Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["my-tutor-profile"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleSave = () => {
    if (!form.hourly_rate || Number(form.hourly_rate) <= 0) {
      toast.error("Set an hourly rate greater than 0.");
      return;
    }
    saveMutation.mutate();
  };

  const addSubjectRow = () =>
    setSubjectRows((rows) => [...rows, { subject_id: "", expertise_level: "all_levels", years_experience: 0 }]);

  const updateSubjectRow = (index: number, patch: Partial<SubjectRow>) =>
    setSubjectRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeSubjectRow = (index: number) => setSubjectRows((rows) => rows.filter((_, i) => i !== index));

  if (isLoading) return <SectionLoader />;

  if (profileHasError) {
    return (
      <Card className="mx-auto max-w-3xl">
        <EmptyState
          icon={AlertCircle}
          title="We couldn't load your tutor profile"
          description="Something went wrong reaching the server. Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => refetchProfile()}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  const showLocation = form.teaching_mode !== "online";

  return (
    <motion.div
      initial={riseInit(12)}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className="mx-auto max-w-3xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {noProfile ? "Set up your tutor profile" : "My tutor profile"}
          </h1>
          <p className="mt-1 text-slate-500">
            {noProfile
              ? "This is what students see in search — availability and verification unlock after this."
              : "Keep your public profile sharp; it's your storefront."}
          </p>
        </div>
        {profile && <Badge tone={statusToTone(profile.verification_status)}>{profile.verification_status.replace("_", " ")}</Badge>}
      </div>

      {/* ------------------------------------------------ Basics */}
      <Card className="mt-6">
        <CardBody className="space-y-4">
          <SectionHeading icon={UserRound}>Basics</SectionHeading>
          <Input
            label="Headline"
            placeholder="e.g. IIT-trained Physics tutor for JEE & boards"
            value={form.headline}
            onChange={(event) => set("headline", event.target.value)}
          />
          <Textarea
            label="Bio"
            placeholder="Tell students how you teach, not just what."
            rows={5}
            value={form.bio}
            onChange={(event) => set("bio", event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Education"
              placeholder="e.g. M.Sc. Physics, IIT Delhi"
              value={form.education}
              onChange={(event) => set("education", event.target.value)}
            />
            <Input
              label="Years of experience"
              type="number"
              min={0}
              max={60}
              value={form.experience_years}
              onChange={(event) => set("experience_years", Number(event.target.value))}
            />
          </div>
          <Input
            label="Languages (comma-separated)"
            placeholder="English, Hindi, Tamil"
            value={languagesInput}
            onChange={(event) => setLanguagesInput(event.target.value)}
          />
        </CardBody>
      </Card>

      {/* ------------------------------------------------ Rates & mode */}
      <Card className="mt-5">
        <CardBody className="space-y-4">
          <SectionHeading icon={Wallet}>Rate &amp; teaching mode</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Hourly rate (₹)"
              type="number"
              min={0}
              value={form.hourly_rate}
              onChange={(event) => set("hourly_rate", event.target.value)}
              hint="Students see this on your profile and in search."
            />
            <Select
              label="Teaching mode"
              value={form.teaching_mode}
              onChange={(event) => set("teaching_mode", event.target.value as FormState["teaching_mode"])}
              options={[
                { value: "online", label: "Online only" },
                { value: "offline", label: "In-person only" },
                { value: "both", label: "Online & in-person" },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------ Location (offline modes) */}
      {showLocation && (
        <Card className="mt-5">
          <CardBody className="space-y-4">
            <SectionHeading icon={MapPin}>Location</SectionHeading>
            <Input label="Address" value={form.address} onChange={(event) => set("address", event.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="City" value={form.city} onChange={(event) => set("city", event.target.value)} />
              <Input label="State" value={form.state} onChange={(event) => set("state", event.target.value)} />
              <Input label="Country" value={form.country} onChange={(event) => set("country", event.target.value)} />
            </div>
            <Input
              label="Travel radius (km)"
              type="number"
              min={0}
              max={200}
              value={form.travel_radius_km}
              onChange={(event) => set("travel_radius_km", Number(event.target.value))}
              hint="How far you'll travel for in-person sessions."
            />
          </CardBody>
        </Card>
      )}

      {/* ------------------------------------------------ Subjects */}
      <Card className="mt-5">
        <CardBody>
          <div className="flex items-center justify-between">
            <SectionHeading icon={GraduationCap}>Subjects you teach</SectionHeading>
            <Button variant="outline" size="sm" onClick={addSubjectRow}>
              <Plus className="h-4 w-4" /> Add subject
            </Button>
          </div>

          {subjectsError && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <AlertCircle className="h-4 w-4 text-danger" /> Couldn't load the subject list.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchSubjects()}>
                Retry
              </Button>
            </div>
          )}

          {subjectRows.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-line">
              <EmptyState
                icon={GraduationCap}
                title="No subjects yet"
                description="Add at least one subject so students can find you in search."
              />
            </div>
          )}

          <div className="mt-4 space-y-3">
            {subjectRows.map((row, index) => (
              <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_8rem_2.5rem]">
                <Select
                  label={index === 0 ? "Subject" : undefined}
                  placeholder="Choose subject"
                  value={row.subject_id}
                  onChange={(event) => updateSubjectRow(index, { subject_id: event.target.value })}
                  options={allSubjects.map((subject) => ({ value: subject.id, label: subject.name }))}
                />
                <Select
                  label={index === 0 ? "Level" : undefined}
                  value={row.expertise_level}
                  onChange={(event) => updateSubjectRow(index, { expertise_level: event.target.value })}
                  options={optionsFor("skill_level")}
                />
                <Input
                  label={index === 0 ? "Years" : undefined}
                  type="number"
                  min={0}
                  max={60}
                  value={row.years_experience}
                  onChange={(event) => updateSubjectRow(index, { years_experience: Number(event.target.value) })}
                />
                <button
                  onClick={() => removeSubjectRow(index)}
                  aria-label="Remove subject"
                  className="mb-1 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-danger-subtle hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={handleSave} isLoading={saveMutation.isPending}>
          <Save className="h-4 w-4" /> {noProfile ? "Create profile" : "Save changes"}
        </Button>
      </div>
    </motion.div>
  );
}
