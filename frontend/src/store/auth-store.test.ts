import { beforeEach, describe, expect, it } from "vitest";

import { makeUser, testTokens } from "@/test/factories";
import { useAuthStore } from "@/store/auth-store";

/**
 * Authentication flow at the store level: login establishes a session, the
 * session survives a reload (persisted), refresh rotates only the access
 * token, and logout leaves nothing behind.
 */

describe("auth store — authentication flows", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
    localStorage.clear();
  });

  it("establishes a session on login", () => {
    const user = makeUser("student");
    useAuthStore.getState().setSession(user, testTokens);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe(user.id);
    expect(state.tokens?.access).toBe("access-token");
  });

  it("exposes the role so navigation can branch on it", () => {
    useAuthStore.getState().setSession(makeUser("institute_admin"), testTokens);
    expect(useAuthStore.getState().user?.role).toBe("institute_admin");
  });

  it("persists the session so a browser refresh stays logged in", () => {
    useAuthStore.getState().setSession(makeUser("tutor"), testTokens);
    const persisted = localStorage.getItem("tutordoor-auth");

    expect(persisted).toBeTruthy();
    const parsed = JSON.parse(persisted as string);
    expect(parsed.state.isAuthenticated).toBe(true);
    expect(parsed.state.user.role).toBe("tutor");
  });

  it("rotates only the access token on refresh, keeping the refresh token", () => {
    useAuthStore.getState().setSession(makeUser("student"), testTokens);
    useAuthStore.getState().setAccessToken("rotated-access");

    const { tokens } = useAuthStore.getState();
    expect(tokens?.access).toBe("rotated-access");
    expect(tokens?.refresh).toBe("refresh-token");
  });

  it("ignores an access-token rotation when there is no session", () => {
    useAuthStore.getState().setAccessToken("orphan-token");
    expect(useAuthStore.getState().tokens).toBeNull();
  });

  it("updates the profile without disturbing the session", () => {
    useAuthStore.getState().setSession(makeUser("student"), testTokens);
    useAuthStore.getState().setUser(makeUser("student", { first_name: "Renamed" }));

    const state = useAuthStore.getState();
    expect(state.user?.first_name).toBe("Renamed");
    expect(state.isAuthenticated).toBe(true);
    expect(state.tokens?.access).toBe("access-token");
  });

  it("clears user and tokens on logout", () => {
    useAuthStore.getState().setSession(makeUser("admin"), testTokens);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });
});
