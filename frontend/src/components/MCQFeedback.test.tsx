import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MCQFeedback from "./MCQFeedback";

const defaultProps = {
  isCorrect: true,
  correctKey: "B",
  chosenKey: "B",
  explanation: "Sell straddle is correct when IV is high.",
  justificationQuality: "good",
  justificationNote: "You correctly identified the vol sell.",
  xpEarned: 8,
  onNext: vi.fn(),
};

describe("MCQFeedback", () => {
  it("shows Correct when isCorrect", () => {
    render(<MCQFeedback {...defaultProps} />);

    expect(screen.getByText(/Correct!/)).toBeTruthy();
  });

  it("shows Incorrect and correct answer when wrong", () => {
    render(
      <MCQFeedback
        {...defaultProps}
        isCorrect={false}
        chosenKey="A"
      />
    );

    expect(screen.getByText(/Incorrect/)).toBeTruthy();
    expect(screen.getByText(/Correct answer:/)).toBeTruthy();
    expect(document.body.textContent).toContain("B");
  });

  it("shows XP earned", () => {
    render(<MCQFeedback {...defaultProps} />);

    expect(screen.getAllByText(/\+8 XP/).length).toBeGreaterThan(0);
  });

  it("shows explanation", () => {
    render(<MCQFeedback {...defaultProps} />);

    expect(screen.getAllByText(/Sell straddle is correct when IV is high/).length).toBeGreaterThan(0);
  });

  it("shows justification quality and note", () => {
    render(<MCQFeedback {...defaultProps} />);

    expect(screen.getAllByText(/Your Reasoning/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Strong/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/You correctly identified the vol sell/).length).toBeGreaterThan(0);
  });

  it("calls onNext when Next Question clicked", () => {
    render(<MCQFeedback {...defaultProps} />);

    const buttons = screen.getAllByRole("button", { name: /Next Question/i });
    fireEvent.click(buttons[0]);

    expect(defaultProps.onNext).toHaveBeenCalled();
  });
});
