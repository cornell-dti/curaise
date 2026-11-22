import { describe, expect, it } from "vitest";
import { formatMoney, profitGoalProgress } from "./profit";

describe("profitGoalProgress", () => {
  it("reports progress toward the goal", () => {
    expect(profitGoalProgress(25, 100)).toEqual({ percentage: 25, remaining: 75 });
  });

  it("caps at 100% once the goal is passed", () => {
    expect(profitGoalProgress(150, 100)).toEqual({ percentage: 100, remaining: 0 });
  });

  it("floors at 0% when costs exceed revenue", () => {
    expect(profitGoalProgress(-20, 100)).toEqual({ percentage: 0, remaining: 120 });
  });

  it("handles a missing goal", () => {
    expect(profitGoalProgress(50, null)).toEqual({ percentage: 0, remaining: 0 });
    expect(profitGoalProgress(50, NaN)).toEqual({ percentage: 0, remaining: 0 });
  });
});

describe("formatMoney", () => {
  it("formats positive and negative amounts", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
    expect(formatMoney(-3)).toBe("-$3.00");
  });
});
