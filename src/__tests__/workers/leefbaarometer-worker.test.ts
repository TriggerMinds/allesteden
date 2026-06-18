import { describe, it, expect } from "vitest";

function scoreFromValue(value: number | undefined | null, max: number, invert = false): number | null {
  if (value == null) return null;
  const clamped = Math.max(0, Math.min(max, value));
  const score = invert ? 10 - (clamped / max) * 10 : (clamped / max) * 10;
  return Math.round(score * 10) / 10;
}

describe("Leefbaarometer Worker — scoreFromValue", () => {
  it("calculates a direct score (non-inverted)", () => {
    expect(scoreFromValue(50, 100, false)).toBe(5);
  });

  it("calculates an inverted score", () => {
    expect(scoreFromValue(20, 100, true)).toBe(8);
  });

  it("handles null input", () => {
    expect(scoreFromValue(null, 100)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(scoreFromValue(undefined, 100)).toBeNull();
  });

  it("clamps values above max", () => {
    expect(scoreFromValue(150, 100, false)).toBe(10);
  });

  it("clamps values below zero", () => {
    expect(scoreFromValue(-10, 100, false)).toBe(0);
  });

  it("rounds to one decimal place", () => {
    expect(scoreFromValue(33, 100, false)).toBe(3.3);
  });

  it("inverted score: high noise = low quiet score", () => {
    expect(scoreFromValue(65, 100, true)).toBe(3.5);
  });
});
