import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    <QueryClientProvider client={queryClient}>
      <TrainingPage
        unlockedCategories={[
          { category: "iv_analysis", difficulty: "beginner" },
          { category: "vol_surface", difficulty: "intermediate" },
        ]}
      />
    </QueryClientProvider>
  );
}

describe("TrainingPage scenario start", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
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

    fireEvent.click(
      screen.getByRole("button", { name: /^Implied Volatility \(IV\) Analysis beginner$/i })
    );

    expect(fetchMock).toHaveBeenCalled();
    expect(vi.mocked(api.post)).not.toHaveBeenCalledWith(
      "/mcq/generate",
      expect.anything()
    );
  });

  it("renders unlocked category cards", () => {
    renderTrainingPage();

    expect(
      screen.getByRole("button", { name: /^Implied Volatility \(IV\) Analysis beginner$/i })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^Volatility Surface intermediate$/i })
    ).toBeTruthy();
  });
});
