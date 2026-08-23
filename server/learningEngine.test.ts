import { describe, expect, it } from "vitest";
import { generateQuestion, masteryFrom, rewardForAttempt } from "./learningEngine";

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
});
