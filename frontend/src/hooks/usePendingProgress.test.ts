import { describe, expect, it } from "vitest";
import { easeInOutCubic } from "./usePendingProgress";

describe("easeInOutCubic", () => {
  it("starts at 0, passes through the midpoint and ends at 1", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("moves slowly at both ends and never goes backwards", () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);

    const steps = Array.from({ length: 101 }, (_, i) => easeInOutCubic(i / 100));
    steps.slice(1).forEach((value, i) => {
      expect(value).toBeGreaterThanOrEqual(steps[i]);
    });
  });

  it("is the same curve in both directions", () => {
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1);
  });
});
