import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { listAdminUsers } from "@/features/admin/api";
import { Paginator } from "@/features/admin/components/Paginator";
import { cn, formatDate } from "@/lib/utils";

const ROLE_TABS = [
  { key: "", label: "All" },
  { key: "student", label: "Students" },
  { key: "tutor", label: "Tutors" },
  { key: "parent", label: "Parents" },
  { key: "institute_admin", label: "Institutes" },
  { key: "admin", label: "Admins" },
] as const;

const ROLE_BADGE: Record<string, string> = {
  student: "Student",
  tutor: "Tutor",
  parent: "Parent",
  institute_admin: "Institute",
  admin: "Admin",
};

export function AdminUsersPage() {
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-users", role, query, isActive, page],
    queryFn: () =>
      listAdminUsers({
        role: role || undefined,
        q: query || undefined,
        is_active: isActive || undefined,
        page,
      }),
  });

  const resetPageAnd = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Users" description="Every account on the platform." />

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <Tabs
          items={ROLE_TABS.map(({ key, label }) => ({ value: key, label }))}
          value={role}
          onChange={(value) => resetPageAnd(setRole)(value)}
        />
        <div className="ml-auto flex items-end gap-2">
          <Input
            placeholder="Search name or email"
            leadingIcon={<Search className="h-4 w-4" />}
            value={query}
            onChange={(event) => resetPageAnd(setQuery)(event.target.value)}
            className="w-56"
          />
          <Select
            value={isActive}
            onChange={(event) => resetPageAnd(setIsActive)(event.target.value)}
            options={[
              { value: "", label: "Any status" },
              { value: "true", label: "Active" },
              { value: "false", label: "Deactivated" },
            ]}
          />
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load users"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : !data || data.results.length === 0 ? (
          <div className="rounded-card border border-dashed border-line py-16 text-center">
            <p className="font-medium text-navy">No users match these filters.</p>
          </div>
        ) : (
          <>
            <Card className={cn(isFetching && "opacity-60")}>
              <div className="divide-y divide-line">
                {data.results.map((user) => (
                  <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                    <Avatar src={user.avatar} firstName={user.first_name} lastName={user.last_name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                        {user.full_name}
                        {user.is_email_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user.email}</p>
                    </div>
                    <Badge tone="neutral">{ROLE_BADGE[user.role] ?? user.role}</Badge>
                    <Badge tone={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "active" : "deactivated"}
                    </Badge>
                    <div className="w-40 text-right text-xs text-slate-400">
                      <p>Joined {formatDate(user.created_at)}</p>
                      <p>{user.last_login ? `Last seen ${formatDate(user.last_login)}` : "Never logged in"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Paginator
              currentPage={data.current_page}
              totalPages={data.total_pages}
              totalCount={data.count}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
