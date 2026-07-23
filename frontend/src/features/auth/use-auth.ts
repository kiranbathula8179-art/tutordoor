import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import * as authApi from "@/features/auth/api";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  student: "/student",
  tutor: "/tutor",
  parent: "/parent",
  institute_admin: "/institute",
  admin: "/admin",
};

export function useAuth() {
  const { user, tokens, isAuthenticated, setSession, logout: clearSession } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.loginUser,
    onSuccess: (data) => {
      setSession(data.user, data.tokens);
      toast.success(`Welcome back, ${data.user.first_name}!`);
      navigate(ROLE_HOME_ROUTE[data.user.role]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.registerUser,
    onSuccess: (data) => {
      setSession(data.user, data.tokens);
      toast.success("Account created! Check your email to verify your address.");
      navigate(ROLE_HOME_ROUTE[data.user.role]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (tokens?.refresh) await authApi.logoutUser(tokens.refresh);
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      navigate("/login");
    },
  });

  return {
    user,
    tokens,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    roleHomeRoute: user ? ROLE_HOME_ROUTE[user.role] : "/",
  };
}
