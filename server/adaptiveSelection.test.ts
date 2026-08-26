import { describe, expect, it } from "vitest";
import { recentPerformanceMetrics, selectAdaptiveSkill } from "./adaptiveSelection";

const skills = [
  { key: "count-to-20", worldKey: "number-valley", order: 1 },
  { key: "number-recognition", worldKey: "number-valley", order: 2 },
  { key: "compare-numbers", worldKey: "number-valley", order: 3 },
];

describe("adaptive server selection", () => {
  it("advances to the next available skill while remediation keeps the weak skill", () => {
    expect(selectAdaptiveSkill({ action: "advance", answeredSkillKey: "count-to-20", availableSkills: skills })).toBe("number-recognition");
    expect(selectAdaptiveSkill({ action: "remediate", answeredSkillKey: "count-to-20", availableSkills: skills })).toBe("count-to-20");
  });

  it("calculates recent accuracy and pace from persisted attempt signals", () => {
    expect(recentPerformanceMetrics([{ isCorrect: true, responseTimeMs: 4000 }, { isCorrect: false, responseTimeMs: 8000 }, { isCorrect: true, responseTimeMs: 6000 }])).toEqual({ correctRate: 2 / 3, averageResponseTimeMs: 6000 });
  });
});
