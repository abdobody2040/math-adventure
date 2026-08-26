import { describe, expect, it } from "vitest";
import { buildAggregateAnalytics, safeAnalyticsPayload } from "./privacyAnalytics";

describe("privacy-conscious analytics", () => {
  it("allows only the minimum payload fields for key product events", () => {
    expect(safeAnalyticsPayload("session_started", { skillKey: "count-to-20", mode: "lesson", childName: "Never keep this" })).toEqual({ skillKey: "count-to-20", mode: "lesson" });
    expect(safeAnalyticsPayload("reward_redeemed", { itemKey: "star-cape", address: "Never keep this" })).toEqual({ itemKey: "star-cape" });
    expect(safeAnalyticsPayload("pet_unlocked", { petKey: "pico-owl", email: "Never keep this" })).toEqual({ petKey: "pico-owl" });
  });

  it("returns an aggregate-only admin summary without child identifiers or raw payloads", () => {
    const summary = buildAggregateAnalytics({ activeChildren: 2, attempts: [{ isCorrect: true }, { isCorrect: false }], events: [{ createdAt: new Date("2026-08-25T12:00:00Z") }], publishedWorlds: 8, publishedSkills: 24 });
    expect(summary).toEqual({ activeChildren: 2, attempts: 2, accuracy: 50, trackedEvents: 1, publishedWorlds: 8, publishedSkills: 24, recentActivity: [{ day: "2026-08-25", count: 1 }] });
    expect(JSON.stringify(summary)).not.toMatch(/childId|parentId|payload|displayName/i);
  });
});
