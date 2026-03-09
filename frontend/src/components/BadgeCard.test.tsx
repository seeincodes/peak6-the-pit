import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BadgeCard from "./BadgeCard";

describe("BadgeCard", () => {
  it("shows earned badge with icon", () => {
    render(
      <BadgeCard
        name="First Steps"
        description="Complete your first scenario"
        icon="footsteps"
        tier="bronze"
        earned={true}
        awardedAt="2026-03-01T12:00:00Z"
      />
    );

    const earned = screen.getAllByLabelText(/First Steps: Complete your first scenario \(Earned\)/);
    expect(earned.length).toBeGreaterThanOrEqual(1);
  });

  it("shows locked badge with Lock icon", () => {
    render(
      <BadgeCard
        name="Rising Star"
        description="Reach level 3"
        icon="star"
        tier="silver"
        earned={false}
        awardedAt={null}
      />
    );

    const locked = screen.getAllByLabelText(/Rising Star: Reach level 3 \(Locked\)/);
    expect(locked.length).toBeGreaterThanOrEqual(1);
  });

  it("shows tooltip with name and description on hover", () => {
    render(
      <BadgeCard
        name="First Steps"
        description="Complete your first scenario"
        icon="footsteps"
        tier="bronze"
        earned={true}
        awardedAt="2026-03-01T12:00:00Z"
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.mouseEnter(buttons[0]);

    expect(screen.getByText(/First Steps/)).toBeTruthy();
    expect(screen.getByText(/Complete your first scenario/)).toBeTruthy();
  });

  it("shows Earned date when earned", () => {
    render(
      <BadgeCard
        name="First Steps"
        description="Complete your first scenario"
        icon="footsteps"
        tier="bronze"
        earned={true}
        awardedAt="2026-03-01T12:00:00Z"
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.mouseEnter(buttons[0]);

    expect(screen.getByText(/Earned/)).toBeTruthy();
  });

});
