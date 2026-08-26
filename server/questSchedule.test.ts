import { describe, expect, it } from "vitest";
import { activeQuestForPeriod } from "./questSchedule";

const quests = [{ key: "daily-five", isDaily: true }, { key: "daily-lesson", isDaily: true }, { key: "weekly-practice", isDaily: false }, { key: "weekly-battle", isDaily: false }];

describe("quest schedule", () => {
  it("rotates among daily and weekly quest variants deterministically", () => {
    expect(activeQuestForPeriod(quests, true, new Date("2026-08-24T12:00:00Z"))?.key).not.toBe(activeQuestForPeriod(quests, true, new Date("2026-08-25T12:00:00Z"))?.key);
    expect(activeQuestForPeriod(quests, false, new Date("2026-08-24T12:00:00Z"))?.key).toBe(activeQuestForPeriod(quests, false, new Date("2026-08-30T12:00:00Z"))?.key);
  });
});
