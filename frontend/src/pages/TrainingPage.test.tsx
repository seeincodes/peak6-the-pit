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

const mockMCQ = {
  id: "prefetch-1",
  category: "iv_analysis",
  difficulty: "beginner",
  content: {
    context: "Market context here",
    question: "What is the best course of action?",
    choices: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
      { key: "C", text: "Option C" },
      { key: "D", text: "Option D" },
    ],
  },
};

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

describe("TrainingPage MCQ prefetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(api.post).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/mcq/generate")) {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: { ...mockMCQ, id: `mcq-${Date.now()}` } } as any), 5000);
        });
      }
      return Promise.resolve({ data: {} } as any);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows question immediately when prefetch completes before Quick Fire click", async () => {
    renderTrainingPage();

    // Prefetch starts on mount — wait for it to complete
    await vi.advanceTimersByTimeAsync(6000);

    // Select category → pick-mode
    fireEvent.click(screen.getByRole("button", { name: /IV ANALYSIS/i }));

    // Click Quick Fire — prefetched MCQ should be ready
    fireEvent.click(screen.getByRole("button", { name: /Quick Fire/i }));

    // Question appears instantly — no "Generating question..." loading state
    expect(screen.queryByText(/Generating question/i)).toBeNull();
    expect(screen.getByText(/What is the best course of action/i)).toBeTruthy();
  });

  it("triggers prefetch for all categories on mount", () => {
    renderTrainingPage();

    // Prefetch should be called for each unlocked category
    expect(api.post).toHaveBeenCalledWith("/mcq/generate", {
      category: "iv_analysis",
      difficulty: "beginner",
    });
    expect(api.post).toHaveBeenCalledWith("/mcq/generate", {
      category: "vol_surface",
      difficulty: "intermediate",
    });
  });
});
