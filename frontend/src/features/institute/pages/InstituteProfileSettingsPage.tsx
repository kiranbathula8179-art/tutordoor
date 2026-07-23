import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { AlertCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  createMyInstituteProfile,
  getMyInstituteProfile,
  updateMyInstituteProfile,
  type InstituteProfilePayload,
} from "@/features/institute/api";
import { getErrorMessage } from "@/lib/utils";

const INITIAL_FORM: InstituteProfilePayload = {
  institute_name: "",
  registration_number: "",
  description: "",
  website: "",
  established_year: null,
  address: "",
  city: "",
  state: "",
  country: "India",
};

export function InstituteProfileSettingsPage() {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError: profileFetchFailed,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-institute"],
    queryFn: getMyInstituteProfile,
    retry: false,
  });

  // A missing profile (404) means "not created yet"; any other error must
  // block the form instead — saving while noProfile is wrongly true would
  // call createMyInstituteProfile against a profile that may already exist.
  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;

  const [form, setForm] = useState<InstituteProfilePayload>(INITIAL_FORM);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      institute_name: profile.institute_name ?? "",
      registration_number: profile.registration_number ?? "",
      description: profile.description ?? "",
      website: profile.website ?? "",
      established_year: profile.established_year ?? null,
      address: profile.address ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      country: profile.country ?? "India",
    });
  }, [profile]);

  const set = <K extends keyof InstituteProfilePayload>(key: K, value: InstituteProfilePayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, website: form.website || undefined, established_year: form.established_year || undefined };
      return noProfile ? createMyInstituteProfile(payload) : updateMyInstituteProfile(payload);
    },
    onSuccess: () => {
      toast.success(noProfile ? "Institute profile created." : "Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["my-institute"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleSave = () => {
    if (!form.institute_name.trim()) {
      setNameError("The institute name is required.");
      return;
    }
    setNameError("");
    saveMutation.mutate();
  };

  if (isLoading) return <SectionLoader />;

  if (profileHasError) {
    return (
      <Card className="mx-auto max-w-3xl">
        <EmptyState
          icon={AlertCircle}
          title="We couldn't load your institute profile"
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={noProfile ? "Set up your institute" : "Institute profile"}
        description={
          noProfile
            ? "Your institute's public identity — the roster and student management unlock after this."
            : "Keep your public details current."
        }
        actions={
          profile && (
            <Badge tone={statusToTone(profile.verification_status)}>
              {profile.verification_status.replace("_", " ")}
            </Badge>
          )
        }
      />

      {profile?.verification_status === "rejected" && profile.rejection_reason && (
        <p className="mt-4 rounded-card border border-danger/25 bg-danger-subtle px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-danger-dark">Verification feedback:</span> {profile.rejection_reason}
        </p>
      )}

      <Card className="mt-6">
        <CardBody className="space-y-4">
          <Input
            label="Institute name"
            placeholder="e.g. Aakash Learning Center"
            value={form.institute_name}
            onChange={(event) => {
              set("institute_name", event.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
          />
          <Textarea
            label="Description"
            rows={4}
            placeholder="What your institute specializes in, and who it serves."
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Registration number"
              value={form.registration_number}
              onChange={(event) => set("registration_number", event.target.value)}
            />
            <Input
              label="Established year"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={form.established_year ?? ""}
              onChange={(event) => set("established_year", event.target.value ? Number(event.target.value) : null)}
            />
          </div>
          <Input
            label="Website"
            type="url"
            placeholder="https://..."
            value={form.website}
            onChange={(event) => set("website", event.target.value)}
          />
          <Input label="Address" value={form.address} onChange={(event) => set("address", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" value={form.city} onChange={(event) => set("city", event.target.value)} />
            <Input label="State" value={form.state} onChange={(event) => set("state", event.target.value)} />
            <Input label="Country" value={form.country} onChange={(event) => set("country", event.target.value)} />
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={handleSave} isLoading={saveMutation.isPending}>
          <Save className="h-4 w-4" /> {noProfile ? "Create profile" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
