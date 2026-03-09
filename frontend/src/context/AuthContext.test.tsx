import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

function TestConsumer() {
  const { user, isLoading, login, logout } = useAuth();
  if (isLoading) return <div data-testid="auth-loading">Loading...</div>;
  if (user) return (
    <div data-testid="auth-authenticated">
      <span data-testid="user-name">{user.display_name}</span>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
  return (
    <form
      data-testid="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        login(form.email.value, form.password.value);
      }}
    >
      <input name="email" defaultValue="test@test.com" />
      <input name="password" defaultValue="pass123" type="password" />
      <button type="submit">Login</button>
    </form>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    delete (api.defaults.headers.common as Record<string, string>)["Authorization"];
  });

  it("shows loading then unauthenticated when no token", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("No token"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Login/i })).toBeTruthy();
    });
  });

  it("shows user when token valid and /users/me succeeds", async () => {
    localStorage.setItem("token", "fake-token");
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: "u1",
        display_name: "Test User",
        level: 2,
        xp_total: 100,
      },
    } as any);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const el = screen.getByTestId("user-name");
      expect(el.textContent).toContain("Test User");
    });

    expect(screen.getAllByRole("button", { name: /Logout/i }).length).toBeGreaterThan(0);
    localStorage.removeItem("token");
  });

  it("clears user when token invalid", async () => {
    localStorage.setItem("token", "bad-token");
    vi.mocked(api.get).mockRejectedValue(new Error("Unauthorized"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Login/i })).toBeTruthy();
    });

    localStorage.removeItem("token");
  });

  it.skip("login calls API and sets user", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("No token"));
    vi.mocked(api.post).mockResolvedValue({
      data: {
        token: "new-token",
        user: {
          id: "u1",
          display_name: "Logged In User",
          level: 1,
          xp_total: 0,
        },
      },
    } as any);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Login/i })).toBeTruthy();
    });

    const forms = screen.getAllByTestId("login-form");
    fireEvent.submit(forms[0]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@test.com",
        password: "pass123",
      });
    });
  });

  it.skip("logout clears user", async () => {
    localStorage.setItem("token", "token");
    vi.mocked(api.get).mockResolvedValue({
      data: { id: "u1", display_name: "User", level: 1, xp_total: 0 },
    } as any);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Logout/i })).toBeTruthy();
    });

    fireEvent.click(screen.getAllByTestId("logout-btn")[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Login/i })).toBeTruthy();
    });

    localStorage.removeItem("token");
  });
});
