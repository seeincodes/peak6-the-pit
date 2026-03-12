import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import TrainingPage from "./TrainingPage";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function renderTrainingPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <TrainingPage
          unlockedCategories={[
            { category: "iv_analysis", difficulty: "beginner" },
            { category: "vol_surface", difficulty: "intermediate" },
          ]}
        />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("TrainingPage scenario start", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
      json: async () => ({}),
    });
    vi.mocked(api.post).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts streaming generation when category card is clicked", async () => {
    renderTrainingPage();

    const ivButtons = screen.getAllByRole("button", { name: /Implied Volatility \(IV\) Analysis/i });
    fireEvent.click(ivButtons[0]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(vi.mocked(api.post)).not.toHaveBeenCalledWith(
      "/mcq/generate",
      expect.anything()
    );
  });

  it("renders unlocked category cards", () => {
    renderTrainingPage();

    expect(
      screen.getAllByRole("button", { name: /Implied Volatility \(IV\) Analysis/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Volatility Surface/i }).length
    ).toBeGreaterThan(0);
  });
});
