import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  CircleOff,
  Database,
  Download,
  FileWarning,
  History,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { Paginator } from "@/features/admin/components/Paginator";
import {
  createMasterDataItem,
  deleteMasterDataItem,
  exportMasterDataCsv,
  importMasterDataCsv,
  listMasterDataAudit,
  listMasterDataItems,
  listMasterDataTypes,
  setMasterDataItemActive,
  updateMasterDataItem,
  type AdminMasterDataItem,
  type MasterDataAuditEntry,
} from "@/features/admin/masterdata-api";
import { usePermissions } from "@/lib/master-data";
import { cn, formatDateTime, getErrorMessage } from "@/lib/utils";

/**
 * Master Data Admin (ADR-001, rollout ④) — the panel that makes "business
 * changes without deploys" real. Every mutation invalidates the public
 * ["master-data"] bootstrap cache, so a new grade level appears in the app's
 * dropdowns the moment it's saved here.
 */

export function AdminMasterDataPage() {
  const queryClient = useQueryClient();
  const {
    can,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch: refetchPermissions,
  } = usePermissions();

  const [activeType, setActiveType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminMasterDataItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminMasterDataItem | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: types = [],
    isLoading: typesLoading,
    isError: typesError,
    refetch: refetchTypes,
  } = useQuery({
    queryKey: ["admin-md-types"],
    queryFn: listMasterDataTypes,
  });

  const selectedType = activeType || types[0]?.code || "";

  const {
    data: items,
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["admin-md-items", selectedType, search, status, page],
    queryFn: () => listMasterDataItems({ type: selectedType || undefined, q: search || undefined, status: status || undefined, page }),
    enabled: !!selectedType,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-md-items"] });
    queryClient.invalidateQueries({ queryKey: ["admin-md-types"] });
    queryClient.invalidateQueries({ queryKey: ["admin-md-audit"] });
    // The whole app's dropdowns drink from this cache — refresh it too.
    queryClient.invalidateQueries({ queryKey: ["master-data"] });
  };

  const activateMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setMasterDataItemActive(id, active),
    onSuccess: (item) => {
      toast.success(`${item.label} ${item.is_active ? "activated" : "deactivated"}.`);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMasterDataItem(id),
    onSuccess: () => {
      toast.success("Item deleted.");
      setDeleting(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const importMutation = useMutation({
    mutationFn: importMasterDataCsv,
    onSuccess: ({ created, updated, errors }) => {
      toast.success(`Import complete: ${created} created, ${updated} updated.`);
      if (errors.length) {
        toast.error(`${errors.length} row(s) skipped — first: ${errors[0]}`);
      }
      setPendingImportFile(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (permissionsLoading) return <SectionLoader />;

  if (permissionsError) {
    return (
      <Card>
        <EmptyState
          icon={AlertCircle}
          title="We couldn't verify your access"
          description="Something went wrong reaching the server. Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => refetchPermissions()}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (!can("masterdata.manage")) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-14 text-center">
          <ShieldAlert className="h-7 w-7 text-danger" />
          <p className="font-semibold text-navy">You don't have master data access</p>
          <p className="text-sm text-slate-600">This area requires the "masterdata.manage" permission.</p>
        </CardBody>
      </Card>
    );
  }

  const currentType = types.find((t) => t.code === selectedType);

  return (
    <div>
      <PageHeader
        title="Master data"
        description="Business vocabulary lives here — changes appear across the platform instantly, no deploy."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPendingImportFile(file);
                event.target.value = "";
              }}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={importMutation.isPending}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button variant="secondary" onClick={() => exportMasterDataCsv(selectedType || undefined)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="secondary" onClick={() => setShowAudit((v) => !v)}>
              <History className="h-4 w-4" /> {showAudit ? "Hide audit" : "Audit log"}
            </Button>
            <Button onClick={() => setEditing("new")} disabled={!selectedType}>
              <Plus className="h-4 w-4" /> New item
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ---------------------------------------------- Type registry rail */}
        <Card className="h-fit">
          <CardBody className="p-2">
            {typesLoading ? (
              <SectionLoader />
            ) : typesError ? (
              <EmptyState
                icon={AlertCircle}
                title="Couldn't load types"
                description="Check your connection and try again."
                action={
                  <Button variant="outline" size="sm" onClick={() => refetchTypes()}>
                    Retry
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-0.5">
                {types.map((type) => (
                  <li key={type.code}>
                    <button
                      onClick={() => {
                        setActiveType(type.code);
                        setPage(1);
                        setSearch("");
                        setStatus("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        type.code === selectedType ? "bg-primary text-white" : "text-slate-600 hover:bg-surface-3 hover:text-navy"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Database className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{type.name}</span>
                      </span>
                      <span
                        className={cn(
                          "ml-2 shrink-0 rounded-pill px-1.5 text-xs",
                          type.code === selectedType ? "bg-canvas/20" : "bg-surface-3"
                        )}
                      >
                        {type.item_count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ---------------------------------------------- Items + audit */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-52 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder={`Search ${currentType?.name.toLowerCase() ?? "items"}…`}
                    className="w-full rounded-xl border border-line bg-canvas py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <Select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>

              {itemsLoading ? (
                <SectionLoader />
              ) : itemsError ? (
                <EmptyState
                  icon={AlertCircle}
                  title="We couldn't load items"
                  description="Something went wrong reaching the server. Check your connection and try again."
                  action={
                    <Button variant="outline" onClick={() => refetchItems()}>
                      Retry
                    </Button>
                  }
                />
              ) : !items || items.results.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-600">No items match. Create one or widen the filters.</p>
              ) : (
                <>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-400">
                          <th className="pb-2 pr-4">Code</th>
                          <th className="pb-2 pr-4">Label</th>
                          <th className="hidden pb-2 pr-4 md:table-cell">Description</th>
                          <th className="pb-2 pr-4">Sort</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.results.map((item) => (
                          <tr key={item.id} className="border-b border-line last:border-0">
                            <td className="py-2.5 pr-4 font-mono text-xs">{item.code}</td>
                            <td className="py-2.5 pr-4 font-medium text-navy">{item.label}</td>
                            <td className="hidden max-w-56 truncate py-2.5 pr-4 text-slate-600 md:table-cell">
                              {item.description || "—"}
                            </td>
                            <td className="py-2.5 pr-4 text-slate-600">{item.sort_order}</td>
                            <td className="py-2.5 pr-4">
                              <Badge tone={item.is_active ? "success" : "neutral"}>
                                {item.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditing(item)}
                                  className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-surface-3 hover:text-navy"
                                  aria-label={`Edit ${item.label}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => activateMutation.mutate({ id: item.id, active: !item.is_active })}
                                  className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-surface-3 hover:text-navy"
                                  aria-label={item.is_active ? `Deactivate ${item.label}` : `Activate ${item.label}`}
                                >
                                  {item.is_active ? <CircleOff className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => setDeleting(item)}
                                  className="rounded-lg p-1.5 text-danger transition-colors hover:bg-danger-subtle"
                                  aria-label={`Delete ${item.label}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Paginator
                    currentPage={items.current_page}
                    totalPages={items.total_pages}
                    totalCount={items.count}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardBody>
          </Card>

          {showAudit && <AuditTrail typeCode={selectedType} />}
        </div>
      </div>

      <ItemFormModal
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        editing={editing}
        typeCode={selectedType}
        typeName={currentType?.name ?? ""}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete item" size="sm">
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold text-navy">{deleting?.label}</span> from{" "}
          <span className="font-mono text-xs">{deleting?.type_code}</span>? Existing records keep the stored code;
          it just stops being offered. Prefer <span className="font-medium">deactivate</span> if unsure.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!pendingImportFile} onClose={() => setPendingImportFile(null)} title="Import CSV" size="sm">
        <div className="flex items-start gap-3">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-slate-600">
            Import <span className="font-mono text-xs font-semibold text-navy">{pendingImportFile?.name}</span>?
            Rows are matched by code — existing items are updated in place and new codes are created. This can't
            be undone in bulk; review the file before continuing.
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setPendingImportFile(null)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            isLoading={importMutation.isPending}
            onClick={() => pendingImportFile && importMutation.mutate(pendingImportFile)}
          >
            Import
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / edit modal
// ---------------------------------------------------------------------------

function ItemFormModal({
  editing,
  typeCode,
  typeName,
  onClose,
  onSaved,
}: {
  editing: AdminMasterDataItem | "new" | null;
  typeCode: string;
  typeName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = editing === "new";
  const item = isNew || !editing ? null : editing;

  const [code, setCode] = useState(item?.code ?? "");
  const [label, setLabel] = useState(item?.label ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(item?.sort_order ?? 0));
  const [metadataText, setMetadataText] = useState(
    item && Object.keys(item.metadata ?? {}).length ? JSON.stringify(item.metadata, null, 2) : ""
  );

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createMasterDataItem>[1]) =>
      isNew ? createMasterDataItem(typeCode, payload) : updateMasterDataItem(item!.id, payload),
    onSuccess: () => {
      toast.success(isNew ? "Item created." : "Item updated.");
      onSaved();
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const submit = () => {
    let metadata: Record<string, unknown> = {};
    if (metadataText.trim()) {
      try {
        metadata = JSON.parse(metadataText);
      } catch {
        toast.error("Metadata must be valid JSON (or left empty).");
        return;
      }
    }
    saveMutation.mutate({
      code: code.trim(),
      label: label.trim(),
      description: description.trim(),
      sort_order: Number(sortOrder) || 0,
      metadata,
    });
  };

  return (
    <Modal
      isOpen={!!editing}
      onClose={onClose}
      title={isNew ? `New ${typeName.replace(/s$/, "").toLowerCase() || "item"}` : `Edit ${item?.label ?? "item"}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="snake_case_slug"
            disabled={!isNew}
            hint={isNew ? "Stored on records — stable, lowercase." : "Codes are stable once created."}
          />
          <Input label="Label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Shown to users" />
        </div>
        <Input
          label="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Sort order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Metadata JSON (optional)</label>
          <textarea
            value={metadataText}
            onChange={(event) => setMetadataText(event.target.value)}
            rows={4}
            placeholder='{"country": "in"}'
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      <Button
        className="mt-5 w-full"
        onClick={submit}
        isLoading={saveMutation.isPending}
        disabled={!code.trim() || !label.trim()}
      >
        {isNew ? "Create item" : "Save changes"}
      </Button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

const ACTION_BADGES: Record<MasterDataAuditEntry["action"], "success" | "warning" | "danger" | "neutral"> = {
  created: "success",
  updated: "warning",
  activated: "success",
  deactivated: "neutral",
  deleted: "danger",
  imported: "warning",
};

function AuditTrail({ typeCode }: { typeCode: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-md-audit", typeCode, page],
    queryFn: () => listMasterDataAudit({ type: typeCode || undefined, page }),
  });

  return (
    <Card>
      <CardBody>
        <h2 className="font-display text-lg font-bold text-navy">Audit log</h2>
        <p className="mt-1 text-xs text-slate-400">Every change, with who and what — field by field.</p>
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load the audit log"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        ) : !data || data.results.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">No audit entries for this type yet.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {data.results.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone={ACTION_BADGES[entry.action]}>{entry.action}</Badge>
                    <span className="font-mono text-xs text-navy">
                      {entry.type_code}
                      {entry.item_code ? `:${entry.item_code}` : ""}
                    </span>
                    <span className="text-xs text-slate-400">
                      {entry.actor_email ?? "system"} · {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                  {Object.keys(entry.changes ?? {}).length > 0 && (
                    <div className="mt-2 space-y-0.5 font-mono text-xs text-slate-600">
                      {Object.entries(entry.changes).map(([field, change]) => (
                        <p key={field} className="truncate">
                          <span className="text-navy">{field}</span>:{" "}
                          {typeof change === "object" && change !== null && "from" in (change as object)
                            ? `${JSON.stringify((change as { from: unknown }).from)} → ${JSON.stringify(
                                (change as { to: unknown }).to
                              )}`
                            : JSON.stringify(change)}
                        </p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Paginator
              currentPage={data.current_page}
              totalPages={data.total_pages}
              totalCount={data.count}
              onPageChange={setPage}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}
