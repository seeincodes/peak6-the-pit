import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfilePage from "./ProfilePage";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  display_name: "Test User",
  avatar_id: "default",
  bio: "Phase 2 TA",
  level: 2,
  level_title: "Rising Star",
  xp_total: 150,
  streak_days: 3,
  all_categories: ["iv_analysis", "greeks", "order_flow"],
  unlocked_categories: ["iv_analysis", "greeks"],
};

const mockBadges = [
  {
    slug: "first_steps",
    name: "First Steps",
    description: "Complete your first scenario",
    icon: "footsteps",
    category: "milestone",
    tier: "bronze",
    earned: true,
    awarded_at: "2026-03-01T12:00:00Z",
  },
];

function renderProfilePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfilePage />
    </QueryClientProvider>
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/users/me") return Promise.resolve({ data: mockUser } as any);
      if (url === "/users/me/badges") return Promise.resolve({ data: mockBadges } as any);
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it("shows profile header with display name and level", async () => {
    const { container } = renderProfilePage();

    await waitFor(() => {
      expect(within(container).getByText("Test User")).toBeTruthy();
      expect(within(container).getByText(/Rising Star/)).toBeTruthy();
      expect(within(container).getByText(/150 XP/)).toBeTruthy();
      expect(within(container).getByText(/Level 2/)).toBeTruthy();
    });
  });

  it("shows bio when present", async () => {
    const { container } = renderProfilePage();

    await waitFor(() => {
      expect(within(container).getByText("Phase 2 TA")).toBeTruthy();
    });
  });

  it("shows Edit profile button", async () => {
    const { container } = renderProfilePage();

    await waitFor(() => {
      const editBtn = within(container).getByRole("button", { name: /Edit profile/i });
      expect(editBtn).toBeTruthy();
    });
  });

  it("toggles to ProfileEditor when Edit clicked", async () => {
    const { container } = renderProfilePage();

    await waitFor(() => {
      expect(within(container).getByText("Test User")).toBeTruthy();
    });

    const editBtn = within(container).getByRole("button", { name: /Edit profile/i });
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(within(container).getByText(/Edit Profile/)).toBeTruthy();
    });
  });

  it("shows BadgeGrid", async () => {
    const { container } = renderProfilePage();

    await waitFor(() => {
      expect(within(container).getByText(/Badges/)).toBeTruthy();
    });
  });

  it("shows Skill Tree section", async () => {
    const { container } = renderProfilePage();

    await waitFor(() => {
      expect(within(container).getByText(/Skill Tree/)).toBeTruthy();
    });
  });
});
