import type { AuthTokens, User, UserRole } from "@/types";

/** Minimal valid User for tests — mirrors the backend serializer shape. */
export function makeUser(role: UserRole, overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "demo@tutordoor.test",
    first_name: "Demo",
    last_name: "User",
    full_name: "Demo User",
    phone_number: null,
    role,
    avatar: null,
    is_email_verified: true,
    is_phone_verified: false,
    referral_code: "AB12CD34",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export const testTokens: AuthTokens = { access: "access-token", refresh: "refresh-token" };
