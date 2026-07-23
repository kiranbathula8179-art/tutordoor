import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

/** Admin API for the Master Data Engine (rollout ④). */

export interface AdminMasterDataType {
  id: string;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  item_count: number;
}

export interface AdminMasterDataItem {
  id: string;
  type_code: string;
  type_name: string;
  code: string;
  label: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MasterDataItemPayload {
  code: string;
  label: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MasterDataAuditEntry {
  id: string;
  actor_email: string | null;
  action: "created" | "updated" | "activated" | "deactivated" | "deleted" | "imported";
  type_code: string;
  item_code: string;
  changes: Record<string, unknown>;
  created_at: string;
}

export async function listMasterDataTypes(): Promise<AdminMasterDataType[]> {
  const { data } = await apiClient.get("/master-data/admin/types/");
  return data.results;
}

export async function listMasterDataItems(params: {
  type?: string;
  q?: string;
  status?: string;
  page?: number;
}): Promise<PaginatedResponse<AdminMasterDataItem>> {
  const { data } = await apiClient.get("/master-data/admin/items/", { params });
  return data;
}

export async function createMasterDataItem(
  typeCode: string,
  payload: MasterDataItemPayload
): Promise<AdminMasterDataItem> {
  const { data } = await apiClient.post("/master-data/admin/items/", { type_code: typeCode, ...payload });
  return data.item;
}

export async function updateMasterDataItem(
  itemId: string,
  payload: Partial<MasterDataItemPayload>
): Promise<AdminMasterDataItem> {
  const { data } = await apiClient.patch(`/master-data/admin/items/${itemId}/`, payload);
  return data.item;
}

export async function setMasterDataItemActive(itemId: string, active: boolean): Promise<AdminMasterDataItem> {
  const { data } = await apiClient.post(`/master-data/admin/items/${itemId}/${active ? "activate" : "deactivate"}/`);
  return data.item;
}

export async function deleteMasterDataItem(itemId: string): Promise<void> {
  await apiClient.delete(`/master-data/admin/items/${itemId}/`);
}

export async function listMasterDataAudit(params: {
  type?: string;
  page?: number;
}): Promise<PaginatedResponse<MasterDataAuditEntry>> {
  const { data } = await apiClient.get("/master-data/admin/audit/", { params });
  return data;
}

export async function importMasterDataCsv(
  file: File
): Promise<{ created: number; updated: number; errors: string[] }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/master-data/admin/items/import/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { created: data.created, updated: data.updated, errors: data.errors };
}

export async function exportMasterDataCsv(typeCode?: string): Promise<void> {
  const response = await apiClient.get("/master-data/admin/items/export/", {
    params: typeCode ? { type: typeCode } : undefined,
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `master-data-${typeCode || "all"}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
