import { describe, expect, it } from "vitest";
import { weekKey } from "./db";

describe("weekly quest periods", () => {
  it("groups a Sunday and its preceding Monday into the same UTC weekly quest period", () => {
    expect(weekKey(new Date("2026-08-24T12:00:00.000Z"))).toBe("2026-08-24");
    expect(weekKey(new Date("2026-08-30T23:59:59.000Z"))).toBe("2026-08-24");
    expect(weekKey(new Date("2026-08-31T00:00:00.000Z"))).toBe("2026-08-31");
  });
});
