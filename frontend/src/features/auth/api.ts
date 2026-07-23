import { apiClient } from "@/lib/api-client";
import type { AuthTokens, User, UserRole } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Exclude<UserRole, "admin">;
  phone_number?: string;
  referral_code?: string;
}

export interface AuthResponse {
  success: true;
  message: string;
  user: User;
  tokens: AuthTokens;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register/", payload);
  return data;
}

export async function loginUser(payload: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login/", payload);
  return data;
}

export async function logoutUser(refresh: string): Promise<void> {
  await apiClient.post("/auth/logout/", { refresh });
}

export async function googleAuth(idToken: string, role: UserRole = "student"): Promise<AuthResponse & { is_new_user: boolean }> {
  const { data } = await apiClient.post("/auth/google/", { id_token: idToken, role });
  return data;
}

export async function fetchMe(): Promise<{ success: true; user: User }> {
  const { data } = await apiClient.get("/auth/me/");
  return data;
}

export async function updateMe(payload: Partial<Pick<User, "first_name" | "last_name">>): Promise<{ user: User }> {
  const { data } = await apiClient.patch("/auth/me/", payload);
  return data;
}

export async function requestOtp(purpose: "phone_verification" | "login"): Promise<void> {
  await apiClient.post("/auth/otp/request/", { purpose });
}

export async function verifyPhone(code: string): Promise<void> {
  await apiClient.post("/auth/otp/verify-phone/", { code });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post("/auth/password/reset/", { email });
}

export async function confirmPasswordReset(payload: { email: string; code: string; new_password: string }): Promise<void> {
  await apiClient.post("/auth/password/reset/confirm/", payload);
}

export async function changePassword(payload: { old_password: string; new_password: string }): Promise<void> {
  await apiClient.post("/auth/password/change/", payload);
}

export async function verifyEmail(token: string): Promise<{ user: User }> {
  const { data } = await apiClient.post("/auth/email/verify/", { token });
  return data;
}

export async function resendVerificationEmail(): Promise<void> {
  await apiClient.post("/auth/email/resend/");
}
