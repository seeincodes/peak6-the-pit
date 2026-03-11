import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MCQCard from "./MCQCard";

const defaultProps = {
  category: "iv_analysis",
  difficulty: "beginner",
  content: {
    context: "SPX 30-day IV has risen from 15 to 22.",
    question: "What is the best course of action?",
    choices: [
      { key: "A", text: "Buy straddle" },
      { key: "B", text: "Sell straddle" },
      { key: "C", text: "Buy calls" },
      { key: "D", text: "Sell puts" },
    ],
  },
  onSelect: vi.fn(),
  disabled: false,
  selectedKey: null,
};

describe("MCQCard", () => {
  it("renders category and question", () => {
    render(<MCQCard {...defaultProps} />);

    expect(screen.getAllByText(/IV ANALYSIS/).length).toBeGreaterThan(0);
    expect(screen.getByText(/SPX 30-day IV has risen/)).toBeTruthy();
    expect(screen.getByText(/What is the best course of action/)).toBeTruthy();
  });

  it("renders all choices", () => {
    render(<MCQCard {...defaultProps} />);

    expect(screen.getAllByText(/Buy straddle/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sell straddle/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Buy calls/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sell puts/).length).toBeGreaterThan(0);
  });

  it("calls onSelect with choice key when clicked", () => {
    render(<MCQCard {...defaultProps} />);

    const buttons = screen.getAllByRole("button", { name: /Buy straddle/i });
    fireEvent.click(buttons[0]);

    expect(defaultProps.onSelect).toHaveBeenCalledWith("A");
  });

  it("shows selected state when selectedKey is set", () => {
    render(<MCQCard {...defaultProps} selectedKey="B" />);

    const sellBtns = screen.getAllByRole("button", { name: /Sell straddle/i });
    const pressedBtn = sellBtns.find((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressedBtn).toBeTruthy();
  });

  it("disables choices when disabled", () => {
    render(<MCQCard {...defaultProps} disabled />);

    const buyBtns = screen.getAllByRole("button", { name: /Buy straddle/i });
    const disabledBtn = buyBtns.find((b) => (b as HTMLButtonElement).disabled);
    expect(disabledBtn).toBeTruthy();
  });

  it("shows intermediate difficulty", () => {
    render(
      <MCQCard
        {...defaultProps}
        difficulty="intermediate"
      />
    );

    expect(screen.getByLabelText(/Difficulty: intermediate/i)).toBeTruthy();
  });
});
