import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { AlertCircle, GraduationCap, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { RequireInstituteProfile } from "@/components/shared/RequireInstituteProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionLoader } from "@/components/ui/Spinner";
import { StarRating } from "@/components/shared/StarRating";
import { getMyInstituteProfile, inviteInstituteTutor, listInstituteTutors } from "@/features/institute/api";
import { searchTutors } from "@/features/tutors/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";
import type { TutorProfile } from "@/types";

export function InstituteTutorsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const still = prefersReducedMotion();

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
    data: links = [],
    isLoading,
    isError: linksError,
    refetch: refetchLinks,
  } = useQuery({
    queryKey: ["institute-tutors"],
    queryFn: () => listInstituteTutors(),
    enabled: !profileFetchFailed,
    retry: false,
  });

  if (profileLoading) return <SectionLoader />;

  if (noProfile || profileHasError) {
    return (
      <div>
        <PageHeader title="Tutor roster" />
        <RequireInstituteProfile
          icon={GraduationCap}
          title="Create your institute profile first"
          description="Your tutor roster is managed under your institute profile."
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
        title="Tutor roster"
        description="Invite verified tutors from the marketplace to teach under your banner."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite a tutor
          </Button>
        }
      />

      {isLoading ? (
        <SectionLoader />
      ) : linksError ? (
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load your roster"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetchLinks()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : links.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={Users}
            title="No tutors on the roster yet"
            description="Invitations appear here as pending until the tutor accepts."
          />
        </Card>
      ) : (
        <motion.div
          initial={still ? false : "hidden"}
          animate="show"
          variants={staggerContainer}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          {links.map((link) => (
            <motion.div key={link.id} variants={staggerItem} className="min-w-0">
              <Card>
                <CardBody className="flex items-center gap-4">
                  <Avatar
                    src={link.tutor.user.avatar}
                    firstName={link.tutor.user.first_name}
                    lastName={link.tutor.user.last_name}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{link.tutor.user.full_name}</p>
                    <p className="truncate text-sm text-slate-500">{link.role_title || link.tutor.headline || "Tutor"}</p>
                    {link.joined_at && (
                      <p className="mt-0.5 text-xs text-slate-400">Joined {formatDate(link.joined_at)}</p>
                    )}
                  </div>
                  <Badge tone={statusToTone(link.status)}>{link.status}</Badge>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <InviteTutorModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function InviteTutorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TutorProfile | null>(null);
  const [roleTitle, setRoleTitle] = useState("");

  const {
    data: results,
    isFetching,
    isError: searchError,
  } = useQuery({
    queryKey: ["tutor-invite-search", query],
    queryFn: () => searchTutors({ query }),
    enabled: isOpen && query.trim().length >= 2,
    retry: false,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteInstituteTutor({ tutor_id: selected!.id, role_title: roleTitle || undefined }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${selected?.user.first_name}.`);
      queryClient.invalidateQueries({ queryKey: ["institute-tutors"] });
      setSelected(null);
      setQuery("");
      setRoleTitle("");
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite a tutor" size="lg">
      {!selected ? (
        <>
          <Input
            label="Search verified tutors"
            placeholder="Name or subject, e.g. 'Physics'"
            leadingIcon={<Search className="h-4 w-4" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className={cn("mt-3 max-h-72 space-y-2 overflow-y-auto", isFetching && "opacity-60")}>
            {query.trim().length < 2 ? (
              <p className="py-6 text-center text-sm text-slate-500">Type at least two characters to search.</p>
            ) : searchError ? (
              <p className="py-6 text-center text-sm text-slate-500">
                <AlertCircle className="mx-auto mb-1.5 h-5 w-5 text-danger" /> Search failed. Try again.
              </p>
            ) : results && results.results.length > 0 ? (
              results.results.map((tutor) => (
                <button
                  key={tutor.id}
                  onClick={() => setSelected(tutor)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-primary/40"
                >
                  <Avatar
                    src={tutor.user.avatar}
                    firstName={tutor.user.first_name}
                    lastName={tutor.user.last_name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">{tutor.user.full_name}</p>
                    <p className="truncate text-xs text-slate-400">{tutor.headline}</p>
                  </div>
                  <StarRating rating={Number(tutor.rating_average)} size="sm" showValue={false} />
                </button>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No verified tutors match that search.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-surface-3 p-3">
            <Avatar
              src={selected.user.avatar}
              firstName={selected.user.first_name}
              lastName={selected.user.last_name}
              size="md"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy">{selected.user.full_name}</p>
              <p className="text-xs text-slate-400">{selected.headline}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs font-medium text-primary hover:underline">
              Change
            </button>
          </div>
          <Input
            label="Role title (optional)"
            placeholder="e.g. Senior Faculty – Physics"
            value={roleTitle}
            onChange={(event) => setRoleTitle(event.target.value)}
            className="mt-4"
          />
          <Button
            className="mt-5 w-full"
            onClick={() => inviteMutation.mutate()}
            isLoading={inviteMutation.isPending}
          >
            Send invitation
          </Button>
        </>
      )}
    </Modal>
  );
}
