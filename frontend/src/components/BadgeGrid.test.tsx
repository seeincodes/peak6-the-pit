import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BadgeGrid from "./BadgeGrid";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

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
  {
    slug: "rising_star",
    name: "Rising Star",
    description: "Reach level 3",
    icon: "star",
    category: "milestone",
    tier: "silver",
    earned: false,
    awarded_at: null,
  },
];

function renderBadgeGrid() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BadgeGrid />
    </QueryClientProvider>
  );
}

describe("BadgeGrid", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: mockBadges } as any);
  });

  it("fetches badges from /users/me/badges", async () => {
    renderBadgeGrid();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/users/me/badges");
    });
  });

  it("shows Badges heading and earned count", async () => {
    const { container } = renderBadgeGrid();

    await waitFor(() => {
      expect(within(container).getByText(/Badges/)).toBeTruthy();
      expect(within(container).getByText(/earned/)).toBeTruthy();
    });
  });

  it("renders all badges", async () => {
    const { container } = renderBadgeGrid();

    await waitFor(() => {
      const earned = within(container).getAllByLabelText(/First Steps: Complete your first scenario \(Earned\)/);
      const locked = within(container).getAllByLabelText(/Rising Star: Reach level 3 \(Locked\)/);
      expect(earned.length).toBeGreaterThanOrEqual(1);
      expect(locked.length).toBeGreaterThanOrEqual(1);
    });
  });
});
