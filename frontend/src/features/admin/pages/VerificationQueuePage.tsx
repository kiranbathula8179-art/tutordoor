import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, BadgeCheck, Check, ExternalLink, Inbox, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SectionLoader } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import {
  approveTutor,
  listPendingVerificationDocuments,
  rejectTutor,
  reviewDocument,
  type AdminVerificationDocument,
} from "@/features/admin/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { DocumentType } from "@/types";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  government_id: "Government ID",
  degree_certificate: "Degree certificate",
  experience_letter: "Experience letter",
  police_verification: "Police verification",
  address_proof: "Address proof",
};

interface TutorGroup {
  tutor: AdminVerificationDocument["tutor"];
  documents: AdminVerificationDocument[];
}

export function VerificationQueuePage() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<TutorGroup["tutor"] | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveTarget, setApproveTarget] = useState<TutorGroup["tutor"] | null>(null);
  const [documentNotes, setDocumentNotes] = useState<Record<string, string>>({});
  const still = prefersReducedMotion();

  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-pending-verifications"],
    queryFn: listPendingVerificationDocuments,
  });

  // Group the flat pending-documents list into one card per tutor.
  const groups = useMemo<TutorGroup[]>(() => {
    const byTutor = new Map<string, TutorGroup>();
    for (const document of documents) {
      const existing = byTutor.get(document.tutor.id);
      if (existing) existing.documents.push(document);
      else byTutor.set(document.tutor.id, { tutor: document.tutor, documents: [document] });
    }
    return [...byTutor.values()];
  }, [documents]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ documentId, approve }: { documentId: string; approve: boolean }) =>
      reviewDocument(documentId, { approve, notes: documentNotes[documentId] ?? "" }),
    onSuccess: (_, variables) => {
      toast.success(variables.approve ? "Document approved." : "Document rejected.");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const approveTutorMutation = useMutation({
    mutationFn: () => approveTutor(approveTarget!.id),
    onSuccess: () => {
      toast.success("Tutor verified — they now appear in search.");
      setApproveTarget(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rejectTutorMutation = useMutation({
    mutationFn: () => rejectTutor(rejectTarget!.id, rejectReason),
    onSuccess: () => {
      toast.success("Tutor verification rejected.");
      setRejectTarget(null);
      setRejectReason("");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader
        title="Tutor verifications"
        description={
          groups.length > 0
            ? `${groups.length} tutor${groups.length === 1 ? "" : "s"} awaiting review`
            : "Review submitted documents, then approve or reject each tutor."
        }
      />

      {isLoading ? (
        <SectionLoader />
      ) : isError ? (
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load the verification queue"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : groups.length === 0 ? (
        <Card className="mt-6">
          <EmptyState icon={Inbox} title="Queue is clear" description="No documents are waiting for review right now." />
        </Card>
      ) : (
        <motion.div
          initial={still ? false : "hidden"}
          animate="show"
          variants={staggerContainer}
          className="mt-6 space-y-5"
        >
          {groups.map((group) => (
            <motion.div key={group.tutor.id} variants={staggerItem}>
            <Card>
              <CardBody>
                {/* ------------------------------------ Tutor header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={group.tutor.full_name.split(" ")[0]}
                      lastName={group.tutor.full_name.split(" ").slice(1).join(" ")}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-navy">{group.tutor.full_name}</p>
                      <p className="text-xs text-slate-400">{group.tutor.email}</p>
                      {group.tutor.headline && <p className="text-xs text-slate-600">{group.tutor.headline}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusToTone(group.tutor.verification_status)}>
                      {group.tutor.verification_status.replace("_", " ")}
                    </Badge>
                    <Button size="sm" onClick={() => setApproveTarget(group.tutor)}>
                      <BadgeCheck className="h-4 w-4" /> Approve tutor
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectTarget(group.tutor)}>
                      Reject
                    </Button>
                  </div>
                </div>

                {/* ------------------------------------ Pending documents */}
                <div className="mt-4 divide-y divide-line rounded-xl border border-line">
                  {group.documents.map((document) => (
                    <div key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy">
                          {DOCUMENT_LABELS[document.document_type] ?? document.document_type}
                        </p>
                        <p className="text-xs text-slate-400">Uploaded {formatDate(document.created_at)}</p>
                      </div>

                      <a
                        href={document.file}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open document
                      </a>

                      <input
                        value={documentNotes[document.id] ?? ""}
                        onChange={(event) =>
                          setDocumentNotes((notes) => ({ ...notes, [document.id]: event.target.value }))
                        }
                        placeholder="Notes (kept on record)"
                        className="w-full rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-navy placeholder:text-slate-400 focus:border-primary focus:outline-none sm:w-52"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => reviewMutation.mutate({ documentId: document.id, approve: true })}
                          aria-label="Approve document"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle text-primary transition-colors hover:bg-primary-dark hover:text-white"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => reviewMutation.mutate({ documentId: document.id, approve: false })}
                          aria-label="Reject document"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-subtle text-danger transition-colors hover:bg-danger hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ------------------------------------------------ Approve-tutor modal */}
      <Modal
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title={`Approve ${approveTarget?.full_name ?? "tutor"}?`}
        size="sm"
      >
        <p className="text-sm text-slate-500">
          This makes {approveTarget?.full_name ?? "the tutor"} publicly bookable and visible in search immediately.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setApproveTarget(null)}>
            Cancel
          </Button>
          <Button onClick={() => approveTutorMutation.mutate()} isLoading={approveTutorMutation.isPending}>
            <BadgeCheck className="h-4 w-4" /> Approve tutor
          </Button>
        </div>
      </Modal>

      {/* ------------------------------------------------ Reject-tutor modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Reject ${rejectTarget?.full_name ?? "tutor"}?`}
        size="sm"
      >
        <p className="text-sm text-slate-500">
          The tutor sees this reason on their verification page, so make it actionable.
        </p>
        <Textarea
          label="Reason"
          placeholder="e.g. The degree certificate photo is unreadable — please re-upload a clearer scan."
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          className="mt-4"
          rows={3}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => rejectTutorMutation.mutate()}
            isLoading={rejectTutorMutation.isPending}
            disabled={!rejectReason.trim()}
          >
            Reject verification
          </Button>
        </div>
      </Modal>
    </div>
  );
}
