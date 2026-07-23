import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { useMasterData } from "@/lib/master-data";
import { AlertCircle, GraduationCap, KeyRound, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import {
  changeMyPassword,
  createMyStudentProfile,
  getMyStudentProfile,
  updateMyAccount,
  updateMyStudentProfile,
  type StudentProfilePayload,
} from "@/features/student/api";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

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

export function StudentProfilePage() {
  const queryClient = useQueryClient();
  const { optionsFor } = useMasterData(["grade_level"]);
  const { user, setUser } = useAuthStore();

  const {
    data: profile,
    isLoading,
    isError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-student-profile"],
    queryFn: getMyStudentProfile,
    retry: false,
  });

  // A missing profile (404) is expected for a student who hasn't set one up
  // yet — anything else (network down, 500) must not be silently treated the
  // same way, or a transient failure could route the save button into
  // "create" and produce a duplicate profile instead of updating the real one.
  const noProfile = isError && isAxiosError(profileError) && profileError.response?.status === 404;
  const hasLoadError = isError && !noProfile;

  // ---------------------------------------------------------------- account
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");

  const accountMutation = useMutation({
    mutationFn: () => updateMyAccount({ first_name: firstName.trim(), last_name: lastName.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Name updated.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ---------------------------------------------------------------- learning profile
  const [form, setForm] = useState<StudentProfilePayload>({
    grade_level: "other",
    school_name: "",
    learning_goals: "",
    preferred_learning_mode: "online",
    city: "",
    state: "",
    country: "India",
    date_of_birth: null,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      grade_level: profile.grade_level ?? "other",
      school_name: profile.school_name ?? "",
      learning_goals: profile.learning_goals ?? "",
      preferred_learning_mode: profile.preferred_learning_mode ?? "online",
      city: profile.city ?? "",
      state: profile.state ?? "",
      country: profile.country ?? "India",
      date_of_birth: profile.date_of_birth ?? null,
    });
  }, [profile]);

  const set = <K extends keyof StudentProfilePayload>(key: K, value: StudentProfilePayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const profileMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, date_of_birth: form.date_of_birth || null };
      return noProfile ? createMyStudentProfile(payload) : updateMyStudentProfile(payload);
    },
    onSuccess: () => {
      toast.success("Learning profile saved.");
      queryClient.invalidateQueries({ queryKey: ["my-student-profile"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ---------------------------------------------------------------- password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const passwordMutation = useMutation({
    mutationFn: () => changeMyPassword({ old_password: oldPassword, new_password: newPassword }),
    onSuccess: () => {
      toast.success("Password changed.");
      setOldPassword("");
      setNewPassword("");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <SectionLoader />;

  if (hasLoadError) {
    return (
      <Card className="mx-auto max-w-3xl">
        <EmptyState
          icon={AlertCircle}
          title="We couldn't load your profile"
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

  return (
    <motion.div
      initial={riseInit(12)}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className="mx-auto max-w-3xl"
    >
      <PageHeader title="My profile" description="Your account, learning details, and security." />

      {/* ------------------------------------------------ Account */}
      <Card className="mt-6">
        <CardBody>
<SectionHeading icon={UserRound}>Account</SectionHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            <Input label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </div>
          <Input label="Email" value={user?.email ?? ""} disabled className="mt-4" />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => accountMutation.mutate()}
              isLoading={accountMutation.isPending}
              disabled={!firstName.trim() || !lastName.trim()}
            >
              <Save className="h-4 w-4" /> Save name
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------ Learning profile */}
      <Card className="mt-6">
        <CardBody>
          <SectionHeading icon={GraduationCap}>Learning profile</SectionHeading>
          <p className="mt-1 text-sm text-slate-500">
            Helps tutors pitch sessions at the right level{noProfile ? " — set it up once and you're done." : "."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              label="Grade / level"
              value={form.grade_level}
              onChange={(event) => set("grade_level", event.target.value)}
              options={optionsFor("grade_level")}
            />
            <Select
              label="Preferred mode"
              value={form.preferred_learning_mode}
              onChange={(event) => set("preferred_learning_mode", event.target.value)}
              options={[
                { value: "online", label: "Online" },
                { value: "offline", label: "In-person" },
                { value: "both", label: "Either" },
              ]}
            />
          </div>
          <Input
            label="School / institution (optional)"
            value={form.school_name}
            onChange={(event) => set("school_name", event.target.value)}
            className="mt-4"
          />
          <Textarea
            label="Learning goals (optional)"
            rows={3}
            placeholder="e.g. Crack JEE Mains physics, or get comfortable speaking English at work."
            value={form.learning_goals}
            onChange={(event) => set("learning_goals", event.target.value)}
            className="mt-4"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Input label="City" value={form.city} onChange={(event) => set("city", event.target.value)} />
            <Input label="State" value={form.state} onChange={(event) => set("state", event.target.value)} />
            <Input
              label="Date of birth"
              type="date"
              value={form.date_of_birth ?? ""}
              onChange={(event) => set("date_of_birth", event.target.value || null)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => profileMutation.mutate()} isLoading={profileMutation.isPending}>
              <Save className="h-4 w-4" /> {noProfile ? "Create profile" : "Save profile"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------ Security */}
      <Card className="mt-6">
        <CardBody>
<SectionHeading icon={KeyRound}>Change password</SectionHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Current password"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
            <Input
              label="New password"
              type="password"
              hint="10+ characters with upper, lower, number & symbol."
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => passwordMutation.mutate()}
              isLoading={passwordMutation.isPending}
              disabled={!oldPassword || !newPassword}
            >
              Update password
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
