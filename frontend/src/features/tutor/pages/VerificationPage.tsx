import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { useMasterData } from "@/lib/master-data";
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, FileUp, ShieldAlert, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { RequireTutorProfile } from "@/components/shared/RequireTutorProfile";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  getMyTutorProfile,
  listMyVerificationDocuments,
  uploadVerificationDocument,
} from "@/features/tutors/api";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { DocumentType } from "@/types";

/** These two trigger the automatic move to "pending review" once both are uploaded. */
const REQUIRED_DOCUMENTS: DocumentType[] = ["government_id", "degree_certificate"];

export function VerificationPage() {
  const queryClient = useQueryClient();
  const { optionsFor } = useMasterData(["document_type"]);
  const documentOptions = optionsFor("document_type");
  const labelFor = (code: string) =>
    documentOptions.find((option) => option.value === code)?.label ?? code.replace(/_/g, " ");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<string>("government_id");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    data: profile,
    isError: profileFetchFailed,
    error: profileError,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-tutor-profile"],
    queryFn: getMyTutorProfile,
    retry: false,
  });

  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;

  const {
    data: documents = [],
    isLoading: documentsLoading,
    isError: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["my-verification-documents"],
    queryFn: listMyVerificationDocuments,
    enabled: !profileFetchFailed,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadVerificationDocument({ document_type: documentType, file: selectedFile! }),
    onSuccess: () => {
      toast.success("Document uploaded for review.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["my-verification-documents"] });
      queryClient.invalidateQueries({ queryKey: ["my-tutor-profile"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (profileLoading) return <SectionLoader />;

  if (noProfile || profileHasError) {
    return (
      <div>
        <PageHeader title="Verification" />
        <RequireTutorProfile
          icon={ShieldAlert}
          title="Create your tutor profile first"
          description="Verification documents attach to your tutor profile."
          hasError={profileHasError}
          onRetry={() => refetchProfile()}
        />
      </div>
    );
  }

  const uploadedTypes = new Set(documents.map((document) => document.document_type));

  return (
    <motion.div
      initial={riseInit(16)}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
    >
      <PageHeader title="Verification" description="Verified tutors appear in search and can accept bookings." />

      {/* ------------------------------------------------ Status banner */}
      {profile && <StatusBanner status={profile.verification_status} rejectionReason={profile.rejection_reason} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/* -------------------------------------------- Upload form */}
          <Card>
            <CardBody>
              <h2 className="font-display text-lg font-bold text-navy">Upload a document</h2>
              <div className="mt-4 space-y-4">
                <Select
                  label="Document type"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  options={documentOptions.map(({ value, label }) => ({
                    value,
                    label: REQUIRED_DOCUMENTS.includes(value as DocumentType) ? `${label} (required)` : label,
                  }))}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">File (PDF or image)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-pill file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-light"
                  />
                </div>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  isLoading={uploadMutation.isPending}
                  disabled={!selectedFile}
                >
                  <FileUp className="h-4 w-4" /> Upload for review
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* -------------------------------------------- Submitted documents */}
          <h2 className="mt-8 font-display text-lg font-bold text-navy">Submitted documents</h2>
          <div className="mt-3">
            {documentsLoading ? (
              <SectionLoader />
            ) : documentsError ? (
              <Card>
                <EmptyState
                  icon={AlertCircle}
                  title="We couldn't load your documents"
                  description="Something went wrong reaching the server — this doesn't mean anything you've uploaded was lost."
                  action={
                    <Button variant="outline" onClick={() => refetchDocuments()}>
                      Retry
                    </Button>
                  }
                />
              </Card>
            ) : documents.length === 0 ? (
              <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-slate-500">
                No documents uploaded yet.
              </p>
            ) : (
              <Card>
                <div className="divide-y divide-line">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy">{labelFor(document.document_type)}</p>
                        <p className="text-xs text-slate-400">Uploaded {formatDate(document.created_at)}</p>
                        {document.status === "rejected" && document.admin_notes && (
                          <p className="mt-1 text-xs text-danger">Reviewer: {document.admin_notes}</p>
                        )}
                      </div>
                      <a
                        href={document.file}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        View
                      </a>
                      <Badge tone={statusToTone(document.status)}>{document.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* ------------------------------------------------ Checklist */}
        <Card className="h-fit">
          <CardBody>
            <h2 className="font-display text-lg font-bold text-navy">Checklist</h2>
            <p className="mt-1 text-xs text-slate-400">
              Uploading both required documents automatically submits you for review.
            </p>
            <ul className="mt-4 space-y-3">
              {documentOptions.map((option) => {
                const uploaded = uploadedTypes.has(option.value as DocumentType);
                const required = REQUIRED_DOCUMENTS.includes(option.value as DocumentType);
                return (
                  <li key={option.value} className="flex items-center gap-2.5 text-sm">
                    {uploaded ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-line" />
                    )}
                    <span className={uploaded ? "text-navy" : "text-slate-600"}>
                      {option.label}
                      {required && <span className="ml-1 text-xs text-danger">*</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}

function StatusBanner({ status, rejectionReason }: { status: string; rejectionReason: string }) {
  if (status === "verified") {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-card border border-primary/20 bg-primary-subtle px-5 py-4">
        <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-primary">You&apos;re verified!</p>
          <p className="text-sm text-slate-600">Your profile shows the verified badge and appears in student search.</p>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-card border border-accent/30 bg-accent-subtle px-5 py-4">
        <Clock3 className="h-6 w-6 shrink-0 text-accent-dark" />
        <div>
          <p className="font-semibold text-accent-dark">Under review</p>
          <p className="text-sm text-slate-600">Our team is reviewing your documents — typically within 2 business days.</p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-card border border-danger/25 bg-danger-subtle px-5 py-4">
        <XCircle className="h-6 w-6 shrink-0 text-danger" />
        <div>
          <p className="font-semibold text-danger-dark">Verification not approved</p>
          <p className="text-sm text-slate-600">
            {rejectionReason || "Please re-upload clearer documents and we'll take another look."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-card border border-line bg-surface px-5 py-4">
      <ShieldAlert className="h-6 w-6 shrink-0 text-slate-400" />
      <div>
        <p className="font-semibold text-navy">Not yet submitted</p>
        <p className="text-sm text-slate-600">
          Upload your government ID and degree certificate to enter the review queue.
        </p>
      </div>
    </div>
  );
}
