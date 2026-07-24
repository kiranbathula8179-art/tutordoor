import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { useMasterData } from "@/lib/master-data";
import { AlertCircle, CheckCircle2, Mail, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { RequireParentProfile } from "@/components/shared/RequireParentProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { createMyParentProfile, getMyParentProfile, inviteChild, listMyChildren } from "@/features/parent/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { getErrorMessage } from "@/lib/utils";

export function ParentChildrenPage() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const still = prefersReducedMotion();

  const {
    isError: profileFetchFailed,
    error: profileError,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-parent-profile"],
    queryFn: getMyParentProfile,
    retry: false,
  });

  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;

  const {
    data: children = [],
    isLoading,
    isError: childrenError,
    refetch: refetchChildren,
  } = useQuery({
    queryKey: ["parent-children"],
    queryFn: listMyChildren,
    enabled: !profileFetchFailed,
    retry: false,
  });

  const activateMutation = useMutation({
    mutationFn: () => createMyParentProfile(),
    onSuccess: () => {
      toast.success("Parent profile activated.");
      queryClient.invalidateQueries({ queryKey: ["my-parent-profile"] });
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (profileLoading) return <SectionLoader />;

  if (noProfile || profileHasError) {
    return (
      <div>
        <PageHeader title="My children" />
        <RequireParentProfile
          icon={Users}
          title="Activate your parent profile"
          description="One click sets up your profile so you can link your children's accounts and manage their learning."
          action={
            <Button onClick={() => activateMutation.mutate()} isLoading={activateMutation.isPending}>
              Activate profile
            </Button>
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
        title="My children"
        description="Invite your child by their TutorDoor email — they confirm from their inbox."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite a child
          </Button>
        }
      />

      {isLoading ? (
        <SectionLoader />
      ) : childrenError ? (
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load your children"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetchChildren()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : children.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <Mail className="h-8 w-8 text-slate-400" />
            <p className="font-medium text-navy">No children linked yet</p>
            <p className="max-w-sm text-sm text-slate-500">
              Send an invitation and it appears here as pending until your child confirms.
            </p>
          </CardBody>
        </Card>
      ) : (
        <motion.div
          initial={still ? false : "hidden"}
          animate="show"
          variants={staggerContainer}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          {children.map((link) => (
            <motion.div key={link.id} variants={staggerItem}>
            <Card>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={link.student.user.avatar}
                      firstName={link.student.user.first_name}
                      lastName={link.student.user.last_name}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-navy">{link.student.user.full_name}</p>
                      <p className="text-sm capitalize text-slate-400">{link.relationship}</p>
                    </div>
                  </div>
                  <Badge tone={statusToTone(link.status)}>{link.status}</Badge>
                </div>

                {link.status === "active" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {link.can_manage_bookings && <PermissionChip label="Manage bookings" />}
                    {link.can_manage_payments && <PermissionChip label="Manage payments" />}
                    {link.can_view_progress && <PermissionChip label="View progress" />}
                  </div>
                )}

                {link.status === "pending" && (
                  <p className="mt-4 text-xs text-slate-400">
                    Waiting for {link.student.user.first_name} to confirm the invitation email.
                  </p>
                )}
              </CardBody>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <InviteChildModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function PermissionChip({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-pill bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
      <CheckCircle2 className="h-3 w-3" /> {label}
    </span>
  );
}

function InviteChildModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { optionsFor } = useMasterData(["relationship_type"]);
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<string>("guardian");

  const inviteMutation = useMutation({
    mutationFn: () => inviteChild({ student_email: email.trim(), relationship }),
    onSuccess: () => {
      toast.success("Invitation sent — your child confirms it from their email.");
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
      setEmail("");
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite your child" size="sm">
      <p className="text-sm text-slate-500">
        They need a TutorDoor student account with this email. They'll get a confirmation link.
      </p>
      <div className="mt-4 space-y-3">
        <Input
          label="Child's email"
          type="email"
          placeholder="child@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Select
          label="Your relationship"
          value={relationship}
          onChange={(event) => setRelationship(event.target.value as typeof relationship)}
          options={optionsFor("relationship_type")}
        />
      </div>
      <Button
        className="mt-5 w-full"
        onClick={() => inviteMutation.mutate()}
        isLoading={inviteMutation.isPending}
        disabled={!email.trim()}
      >
        Send invitation
      </Button>
    </Modal>
  );
}
