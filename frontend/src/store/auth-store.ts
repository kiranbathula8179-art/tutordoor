import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthTokens, User } from "@/types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setSession: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setAccessToken: (access: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setSession: (user, tokens) => set({ user, tokens, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      setAccessToken: (access) => {
        const current = get().tokens;
        if (!current) return;
        set({ tokens: { ...current, access } });
      },

      logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
    }),
    {
      name: "tutordoor-auth",
      // NOTE: tokens live in localStorage to match the backend's header-based
      // Bearer JWT design (see SIMPLE_JWT in config/settings/base.py). For a
      // higher XSS-hardening bar in production, migrate to httpOnly cookies
      // + a CSRF token and drop this persisted `tokens` field entirely.
      partialize: (state) => ({ user: state.user, tokens: state.tokens, isAuthenticated: state.isAuthenticated }),
    }
  )
);
