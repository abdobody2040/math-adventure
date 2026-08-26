import { describe, expect, it } from "vitest";
import { applyPersistedPerformanceGuard, resolveAdaptiveQuestionTarget } from "./nextQuestionTarget";

const skills = [{ key: "count-to-20" }, { key: "number-recognition" }, { key: "compare-numbers" }];

describe("next adaptive question target", () => {
  it("overrides a requested skill when remediation targets a weak skill", () => {
    expect(resolveAdaptiveQuestionTarget({ unlockedSkills: skills, masteryBySkill: new Map([["count-to-20", 80], ["number-recognition", 20]]), requestedSkillKey: "count-to-20", recommendation: { skillKey: "number-recognition", action: "remediate", difficulty: 1 } })).toEqual({ skillKey: "number-recognition", difficulty: 1, action: "remediate" });
  });

  it("overrides a requested skill and keeps the server-selected difficulty for advancement", () => {
    expect(resolveAdaptiveQuestionTarget({ unlockedSkills: skills, masteryBySkill: new Map(), requestedSkillKey: "count-to-20", recommendation: { skillKey: "compare-numbers", action: "advance", difficulty: 5 } })).toEqual({ skillKey: "compare-numbers", difficulty: 5, action: "advance" });
  });

  it("uses persisted performance signals to hold an advance recommendation at review level when needed", () => {
    const target = { skillKey: "compare-numbers", difficulty: 5, action: "advance" as const };
    expect(applyPersistedPerformanceGuard(target, { skillKey: "compare-numbers", correctRateBps: 6000, averageResponseTimeMs: 13000, usedHint: true })).toEqual({ skillKey: "compare-numbers", difficulty: 2, action: "review" });
    expect(applyPersistedPerformanceGuard(target, { skillKey: "compare-numbers", correctRateBps: 9500, averageResponseTimeMs: 4000, usedHint: false })).toEqual(target);
  });
});
