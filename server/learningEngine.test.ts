import { describe, expect, it } from "vitest";
import { generateBossQuestion, generateQuestion, masteryFrom, recommendAdaptiveNext, rewardForAttempt } from "./learningEngine";

describe("learningEngine", () => {
  it("generates the same template-driven question for the same session seed", () => {
    const first = generateQuestion("add-within-10", 1, "session-123");
    const second = generateQuestion("add-within-10", 1, "session-123");

    expect(second).toEqual(first);
    expect(first.presentation.kind).toBe("addition");
  });

  it("changes generated content when the session seed changes", () => {
    const first = generateQuestion("count-to-20", 1, "session-one");
    const second = generateQuestion("count-to-20", 1, "session-two");

    expect(second).not.toEqual(first);
  });

  it("rewards correct answers more generously while keeping brave attempts positive", () => {
    expect(rewardForAttempt(false, 9000)).toEqual({ xp: 2, coins: 0 });
    expect(rewardForAttempt(true, 9000)).toEqual({ xp: 10, coins: 3 });
    expect(rewardForAttempt(true, 4000)).toEqual({ xp: 13, coins: 4 });
  });

  it("bases mastery primarily on accuracy with a bounded speed contribution", () => {
    expect(masteryFrom(0, 0, 3000)).toBe(0);
    expect(masteryFrom(10, 10, 3000)).toBe(95);
    expect(masteryFrom(10, 4, 3000)).toBe(41);
  });

  it("generates expanded deterministic formats", () => {
    expect(generateQuestion("times-tables", 2, "math-1").presentation.kind).toBe("multiplication");
    expect(generateQuestion("basic-division", 2, "math-2").presentation.kind).toBe("division");
    expect(generateQuestion("fraction-concepts", 2, "math-3").presentation.interaction).toBe("visual");
    expect(generateQuestion("logical-reasoning", 2, "math-4").presentation.interaction).toBe("trueFalse");
  });

  it("creates a structured, canonical pair-matching question", () => {
    const question = generateQuestion("equivalent-fractions", 2, "match-1");
    expect(question.presentation.interaction).toBe("matching");
    expect(question.presentation.matchingPairs).toEqual([{ source: "1/2", target: "2/4" }, { source: "1/3", target: "2/6" }]);
    expect(question.presentation.matchTargets).toHaveLength(2);
    expect(question.correctAnswer).toBe("1/2:2/4|1/3:2/6");
  });

  it("recommends a change in learning action from child performance signals", () => {
    expect(recommendAdaptiveNext({ attempts: 4, correctAnswers: 1, mastery: 20, responseTimeMs: 9000, usedHint: true }).action).toBe("remediate");
    expect(recommendAdaptiveNext({ attempts: 8, correctAnswers: 5, mastery: 48, responseTimeMs: 10000, usedHint: false }).action).toBe("practice");
    expect(recommendAdaptiveNext({ attempts: 10, correctAnswers: 10, mastery: 90, responseTimeMs: 4000, usedHint: false, recentCorrectRate: 1 }).action).toBe("advance");
  });

  it("creates a deterministic mixed-skill boss question for a world", () => {
    const first = generateBossQuestion("multiplication-mountains", 3, "boss-seed");
    const second = generateBossQuestion("multiplication-mountains", 3, "boss-seed");
    expect(first).toEqual(second);
    expect(first.presentation.interaction).toBe("boss");
    expect(first.skillKey).toMatch(/repeated-addition|multiplication-concepts|times-tables|mental-multiplication|multiplication-word-problems/);
  });
});
