import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getLocalMockFundraiser, getLocalMockItems } from "./fundraiser";

afterEach(() => vi.unstubAllEnvs());

describe("temporary local fundraiser", () => {
  it("only exposes the approved fixture on local development hosts", () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const host of ["localhost:8080", "127.0.0.1:8080", "[::1]:8080"]) {
      const fixture = getLocalMockFundraiser(host);
      expect(fixture?.organization.authorized).toBe(true);
      expect(fixture?.pickupEvents[0].startsAt.toISOString()).toBe("2026-11-16T17:00:00.000Z");
      expect(fixture?.pickupEvents[0].endsAt.toISOString()).toBe("2026-11-16T23:00:00.000Z");
    }
    expect(getLocalMockFundraiser("example.com")).toBeNull();
    expect(getLocalMockFundraiser("localhost.example.com")).toBeNull();
    vi.stubEnv("LOCAL_MOCK_FUNDRAISER", "false");
    expect(getLocalMockFundraiser("localhost:8080")).toBeNull();
  });

  it("never enables fixture data in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getLocalMockFundraiser("localhost:8080")).toBeNull();
  });

  it("labels all three placeholder prices and represents no confirmed orders", () => {
    const items = getLocalMockItems();
    expect(items).toHaveLength(3);
    expect(new Set(items.map((item) => item.id)).size).toBe(3);
    for (const item of items) {
      expect(item.name).toContain("[TEST PRICE]");
      expect(item.confirmedCount).toBe(0);
      expect(item.description).toContain("local UI testing only");
    }
  });
});
