import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Frontend adoption of the Master Data Engine + dynamic RBAC (ADR-001,
 * rollout ③).
 *
 * useMasterData(types) — one bootstrap round-trip for any number of
 * vocabularies, cached hard (30 min stale) because vocabulary changes are
 * admin-panel events, not per-session events. Components render option lists
 * from the database instead of hardcoded arrays; a new grade level added in
 * the Master Data Admin appears here with zero code changes.
 *
 * usePermissions() — the caller's roles + permission codenames from
 * /rbac/my-permissions/, with a `can("module.action")` helper for UI gating.
 * UI gating is UX, not security — the API enforces for real.
 */

export interface MasterDataOption {
  value: string;
  label: string;
  description: string;
  sort_order: number;
  metadata: Record<string, unknown>;
}

export type MasterDataMap = Record<string, MasterDataOption[]>;

export async function getMasterDataBootstrap(types: string[]): Promise<MasterDataMap> {
  const { data } = await apiClient.get("/master-data/bootstrap/", {
    params: { types: types.join(",") },
  });
  return data.data as MasterDataMap;
}

export function useMasterData(types: string[]) {
  const sorted = [...types].sort();
  const query = useQuery({
    queryKey: ["master-data", sorted.join(",")],
    queryFn: () => getMasterDataBootstrap(sorted),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const optionsFor = (type: string): MasterDataOption[] => query.data?.[type] ?? [];

  return { ...query, optionsFor };
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export interface MyPermissions {
  archetype: string;
  roles: Array<{ code: string; name: string; archetype: string }>;
  permissions: string[];
}

export async function getMyPermissions(): Promise<MyPermissions> {
  const { data } = await apiClient.get("/rbac/my-permissions/");
  return { archetype: data.archetype, roles: data.roles, permissions: data.permissions };
}

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: getMyPermissions,
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const can = (codename: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true; // mirrors backend admin-archetype pass
    return query.data?.permissions.includes(codename) ?? false;
  };

  return { ...query, can };
}
