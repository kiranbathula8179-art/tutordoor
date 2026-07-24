import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { AlertCircle, Mail, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { RequireInstituteProfile } from "@/components/shared/RequireInstituteProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionLoader } from "@/components/ui/Spinner";
import { enrollInstituteStudent, getMyInstituteProfile, listInstituteStudents } from "@/features/institute/api";
import { formatDate, getErrorMessage } from "@/lib/utils";

export function InstituteStudentsPage() {
  const queryClient = useQueryClient();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [email, setEmail] = useState("");

  const {
    isError: profileFetchFailed,
    error: profileError,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-institute"],
    queryFn: getMyInstituteProfile,
    retry: false,
  });

  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;

  const {
    data: enrollments = [],
    isLoading,
    isError: enrollmentsError,
    refetch: refetchEnrollments,
  } = useQuery({
    queryKey: ["institute-students"],
    queryFn: () => listInstituteStudents(),
    enabled: !profileFetchFailed,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollInstituteStudent(email.trim()),
    onSuccess: () => {
      toast.success("Student enrolled with your institute.");
      queryClient.invalidateQueries({ queryKey: ["institute-students"] });
      setEmail("");
      setEnrollOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (profileLoading) return <SectionLoader />;

  if (noProfile || profileHasError) {
    return (
      <div>
        <PageHeader title="Enrolled students" />
        <RequireInstituteProfile
          icon={Users}
          title="Create your institute profile first"
          description="Student enrollment is managed under your institute profile."
          action={
            <Link to="/institute/profile">
              <Button>Set up profile</Button>
            </Link>
          }
          hasError={profileHasError}
          onRetry={() => refetchProfile()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Enrolled students"
        description="Students registered with your institute, by their TutorDoor email."
        actions={
          <Button onClick={() => setEnrollOpen(true)}>
            <UserPlus className="h-4 w-4" /> Enroll a student
          </Button>
        }
      />

      {isLoading ? (
        <SectionLoader />
      ) : enrollmentsError ? (
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load your students"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetchEnrollments()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : enrollments.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={Mail}
            title="No students enrolled yet"
            description="Enroll students by the email on their TutorDoor account."
          />
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="divide-y divide-line">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar
                  src={enrollment.student.user.avatar}
                  firstName={enrollment.student.user.first_name}
                  lastName={enrollment.student.user.last_name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy">{enrollment.student.user.full_name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {enrollment.student.user.email} · enrolled {formatDate(enrollment.enrolled_at)}
                  </p>
                </div>
                <Badge tone={statusToTone(enrollment.status)}>{enrollment.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll a student" size="sm">
        <p className="text-sm text-slate-500">They need an existing TutorDoor student account with this email.</p>
        <Input
          label="Student's email"
          type="email"
          placeholder="student@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-4"
        />
        <Button
          className="mt-5 w-full"
          onClick={() => enrollMutation.mutate()}
          isLoading={enrollMutation.isPending}
          disabled={!email.trim()}
        >
          Enroll student
        </Button>
      </Modal>
    </div>
  );
}
