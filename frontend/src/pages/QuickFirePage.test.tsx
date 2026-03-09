import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QuickFirePage from "./QuickFirePage";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockMCQ = {
  id: "mcq-1",
  category: "iv_analysis",
  difficulty: "beginner",
  content: {
    context: "SPX IV is elevated.",
    question: "What is the best trade?",
    choices: [
      { key: "A", text: "Buy straddle" },
      { key: "B", text: "Sell straddle" },
      { key: "C", text: "Buy calls" },
      { key: "D", text: "Sell puts" },
    ],
  },
};

function renderQuickFirePage(props: {
  initialMCQ?: typeof mockMCQ | null;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <QuickFirePage
        category="iv_analysis"
        difficulty="beginner"
        onExit={vi.fn()}
        initialMCQ={props.initialMCQ}
      />
    </QueryClientProvider>
  );
}

describe("QuickFirePage", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/mcq/generate")) {
        return Promise.resolve({ data: { ...mockMCQ, id: `mcq-${Date.now()}` } } as any);
      }
      if (typeof url === "string" && url.includes("/mcq/submit")) {
        return Promise.resolve({
          data: {
            is_correct: true,
            correct_key: "B",
            explanation: "Sell straddle is correct.",
            justification_quality: "good",
            justification_note: "Good reasoning.",
            xp_earned: 8,
            xp_total: 100,
            level: 2,
          },
        } as any);
      }
      return Promise.resolve({ data: {} } as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows question immediately when initialMCQ is provided", () => {
    renderQuickFirePage({ initialMCQ: mockMCQ });

    expect(screen.queryByText(/Generating question/i)).toBeNull();
    expect(screen.getByText(/What is the best trade/i)).toBeTruthy();
    expect(screen.getByText(/Buy straddle/)).toBeTruthy();
  });

  it("shows loading then question when no initialMCQ", async () => {
    renderQuickFirePage();

    expect(screen.getByText(/Generating question/i)).toBeTruthy();

    await vi.waitFor(() => {
      expect(screen.getByText(/What is the best trade/i)).toBeTruthy();
    });
  }, 10000);

  it("calls onSelect when choice is clicked", () => {
    renderQuickFirePage({ initialMCQ: mockMCQ });

    const buttons = screen.getAllByRole("button", { name: /Buy straddle/i });
    fireEvent.click(buttons[0]);

    expect(screen.getByText(/Why did you pick A/i)).toBeTruthy();
  });

  it("shows Back button", () => {
    renderQuickFirePage({ initialMCQ: mockMCQ });

    expect(screen.getAllByRole("button", { name: /Back/i }).length).toBeGreaterThan(0);
  });

  it("displays category badge", () => {
    renderQuickFirePage({ initialMCQ: mockMCQ });

    expect(screen.getAllByText(/IV ANALYSIS/).length).toBeGreaterThan(0);
  });
});
