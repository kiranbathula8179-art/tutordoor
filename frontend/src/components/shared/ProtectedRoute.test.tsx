import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { makeUser, testTokens } from "@/test/factories";
import { useAuthStore } from "@/store/auth-store";

/**
 * ProtectedRoute is the frontend half of access control. These tests assert
 * the three outcomes that matter: unauthenticated users are bounced to login,
 * authenticated users of the wrong role cannot reach another portal, and the
 * correct role renders through.
 */

function renderStudentArea() {
  return render(
    <MemoryRouter initialEntries={["/student"]}>
      <Routes>
        <Route path="/" element={<p>landing</p>} />
        <Route path="/login" element={<p>login screen</p>} />
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student" element={<p>student dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
  });

  it("redirects an unauthenticated visitor to the login screen", () => {
    renderStudentArea();
    expect(screen.getByText("login screen")).toBeInTheDocument();
    expect(screen.queryByText("student dashboard")).not.toBeInTheDocument();
  });

  it("blocks an authenticated user whose role is not allowed", () => {
    useAuthStore.setState({ user: makeUser("tutor"), tokens: testTokens, isAuthenticated: true });
    renderStudentArea();
    expect(screen.queryByText("student dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("landing")).toBeInTheDocument();
  });

  it("renders the protected page for the allowed role", () => {
    useAuthStore.setState({ user: makeUser("student"), tokens: testTokens, isAuthenticated: true });
    renderStudentArea();
    expect(screen.getByText("student dashboard")).toBeInTheDocument();
  });

  it("treats an authenticated flag without a user object as unauthenticated", () => {
    useAuthStore.setState({ user: null, tokens: testTokens, isAuthenticated: true });
    renderStudentArea();
    expect(screen.getByText("login screen")).toBeInTheDocument();
  });
});
