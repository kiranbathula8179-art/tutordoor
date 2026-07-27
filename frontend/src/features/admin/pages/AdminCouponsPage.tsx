import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, Ticket } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { createCoupon, listAdminCoupons, updateCoupon, type AdminCoupon } from "@/features/admin/api";
import { cn, formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

export function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: coupons = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: listAdminCoupons,
  });

  const toggleMutation = useMutation({
    mutationFn: (coupon: AdminCoupon) => updateCoupon(coupon.id, { is_active: !coupon.is_active }),
    onSuccess: (updated) => {
      toast.success(updated.is_active ? `${updated.code} is live.` : `${updated.code} paused.`);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes for bookings, courses, and subscriptions."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load coupons"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : coupons.length === 0 ? (
          <Card>
            <EmptyState
              icon={Ticket}
              title="No coupons yet"
              description="Create one to run a discount campaign."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> New coupon
                </Button>
              }
            />
          </Card>
        ) : (
          <Card className={cn(isFetching && "opacity-60")}>
            <div className="divide-y divide-line">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold tracking-wide text-navy">{coupon.code}</p>
                    <p className="truncate text-xs text-slate-400">{coupon.description || "—"}</p>
                  </div>
                  <span className="w-28 text-sm font-semibold text-navy">
                    {coupon.discount_type === "percentage"
                      ? `${Number(coupon.discount_value)}% off`
                      : `${formatCurrency(coupon.discount_value)} off`}
                  </span>
                  <Badge tone="neutral">{coupon.applicable_to}</Badge>
                  <span className="w-40 text-xs text-slate-400">
                    {formatDate(coupon.valid_from)} → {formatDate(coupon.valid_until)}
                  </span>
                  <span className="w-24 text-xs text-slate-400">
                    Used {coupon.times_used}
                    {coupon.usage_limit_total ? ` / ${coupon.usage_limit_total}` : ""}
                  </span>
                  <Badge tone={coupon.is_active ? "success" : "danger"}>
                    {coupon.is_active ? "active" : "paused"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMutation.mutate(coupon)}
                    isLoading={toggleMutation.isPending && toggleMutation.variables?.id === coupon.id}
                  >
                    {coupon.is_active ? "Pause" : "Activate"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <CreateCouponModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateCouponModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "flat",
    discount_value: "",
    max_discount_amount: "",
    min_order_amount: "0",
    applicable_to: "all" as AdminCoupon["applicable_to"],
    valid_from: "",
    valid_until: "",
    usage_limit_total: "",
    usage_limit_per_user: "1",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_discount_amount: form.max_discount_amount || null,
        min_order_amount: form.min_order_amount || "0",
        applicable_to: form.applicable_to,
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: new Date(form.valid_until).toISOString(),
        usage_limit_total: form.usage_limit_total ? Number(form.usage_limit_total) : null,
        usage_limit_per_user: Number(form.usage_limit_per_user) || 1,
        is_active: true,
      }),
    onSuccess: (coupon) => {
      toast.success(`Coupon ${coupon.code} is live.`);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleCreate = () => {
    if (!form.code.trim()) return toast.error("Give the coupon a code.");
    if (!form.discount_value || Number(form.discount_value) <= 0) return toast.error("Set a discount value.");
    if (!form.valid_from || !form.valid_until) return toast.error("Set the validity window.");
    createMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a coupon" size="lg">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            placeholder="e.g. DIWALI25"
            value={form.code}
            onChange={(event) => set("code", event.target.value.toUpperCase())}
          />
          <Input
            label="Description"
            placeholder="Internal note or campaign name"
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Type"
            value={form.discount_type}
            onChange={(event) => set("discount_type", event.target.value as "percentage" | "flat")}
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "flat", label: "Flat amount" },
            ]}
          />
          <Input
            label={form.discount_type === "percentage" ? "Percent off" : "Amount off (₹)"}
            type="number"
            min={1}
            value={form.discount_value}
            onChange={(event) => set("discount_value", event.target.value)}
          />
          <Input
            label="Max discount (₹, optional)"
            type="number"
            min={0}
            value={form.max_discount_amount}
            onChange={(event) => set("max_discount_amount", event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Applies to"
            value={form.applicable_to}
            onChange={(event) => set("applicable_to", event.target.value as AdminCoupon["applicable_to"])}
            options={[
              { value: "all", label: "Everything" },
              { value: "booking", label: "1-on-1 bookings" },
              { value: "course", label: "Courses" },
              { value: "subscription", label: "Subscriptions" },
            ]}
          />
          <Input
            label="Valid from"
            type="datetime-local"
            value={form.valid_from}
            onChange={(event) => set("valid_from", event.target.value)}
          />
          <Input
            label="Valid until"
            type="datetime-local"
            value={form.valid_until}
            onChange={(event) => set("valid_until", event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Min order (₹)"
            type="number"
            min={0}
            value={form.min_order_amount}
            onChange={(event) => set("min_order_amount", event.target.value)}
          />
          <Input
            label="Total usage cap (blank = ∞)"
            type="number"
            min={1}
            value={form.usage_limit_total}
            onChange={(event) => set("usage_limit_total", event.target.value)}
          />
          <Input
            label="Per-user limit"
            type="number"
            min={1}
            value={form.usage_limit_per_user}
            onChange={(event) => set("usage_limit_per_user", event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={createMutation.isPending}>
            Create coupon
          </Button>
        </div>
      </div>
    </Modal>
  );
}
