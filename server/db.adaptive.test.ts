import { describe, expect, it } from "vitest";
import { getAdaptiveNextQuestion, resolvePersistedAdaptiveQuestion } from "./db";

describe("persisted adaptive next-question selection", () => {
  it("uses a saved low-performance snapshot to turn a persisted advance into a lower-difficulty review", () => {
    const result = resolvePersistedAdaptiveQuestion({
      progressRows: [{ skillKey: "number-recognition", mastery: 86 }],
      unlockedWorldKeys: ["number-valley"],
      requestedSkillKey: "count-to-20",
      recommendations: [{ skillKey: "number-recognition", action: "advance", difficulty: 5 }],
      snapshots: [{ skillKey: "number-recognition", correctRateBps: 6000, averageResponseTimeMs: 12000, usedHint: true }],
    });

    expect(result).toEqual({ skillKey: "number-recognition", action: "review", difficulty: 2, activity: "review" });
  });

  it("returns the snapshot-adjusted target through the real next-question data function", async () => {
    const result = await getAdaptiveNextQuestion(7, { childId: "7d9e2143-72a6-4a78-9bf4-d0302f538b3b", requestedSkillKey: "count-to-20" }, async () => ({
      progressRows: [{ skillKey: "number-recognition", mastery: 86 }],
      unlockedWorldKeys: ["number-valley"],
      recommendations: [{ skillKey: "number-recognition", action: "advance", difficulty: 5 }],
      snapshots: [{ skillKey: "number-recognition", correctRateBps: 6000, averageResponseTimeMs: 12000, usedHint: true }],
    }));
    expect(result).toEqual({ skillKey: "number-recognition", action: "review", difficulty: 2, activity: "review" });
  });
});
