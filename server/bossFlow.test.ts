import { describe, expect, it } from "vitest";
import { calculateBossCompletion, calculateBossHealth, createBossQuestionDraft } from "./bossFlow";

describe("boss flow core", () => {
  it("creates an authored boss-template question for a persisted attempt seed", () => {
    const first = createBossQuestionDraft("multiplication-mountains", "attempt-1", 1724414400000);
    const second = createBossQuestionDraft("multiplication-mountains", "attempt-1", 1724414400000);
    expect(first).toEqual(second);
    expect(first.presentation).toMatchObject({ interaction: "boss", bossTemplateKey: expect.stringMatching(/^boss-multiply-/), bossChallengeKey: expect.any(String) });
  });

  it("reduces health only for a correct answer and completes at zero", () => {
    expect(calculateBossHealth(100, false)).toBe(100);
    expect(calculateBossHealth(34, true)).toBe(0);
    expect(calculateBossCompletion({ worldKey: "addition-forest", healthRemaining: 0, rewardXp: 60, rewardCoins: 25, currentXp: 140, currentCoins: 19 })).toEqual({
      completed: true,
      xp: 200,
      coins: 44,
      level: 3,
      completionRewards: { xp: 60, coins: 25, unlockedWorldKey: "subtraction-desert" },
    });
  });
});
