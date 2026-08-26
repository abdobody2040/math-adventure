import { describe, expect, it } from "vitest";
import { questProgressPlan } from "./questProgress";

describe("quest progress plans", () => {
  it("progresses the answer-driven daily and weekly quests without exceeding their targets", () => {
    expect(questProgressPlan({ event: "answer_submitted", quest: { key: "daily-five", target: 5 }, currentProgress: 4 })).toEqual({ shouldPersist: true, progress: 5, completed: true });
    expect(questProgressPlan({ event: "answer_submitted", quest: { key: "weekly-practice", target: 5 }, currentProgress: 5 })).toEqual({ shouldPersist: true, progress: 5, completed: true });
  });

  it("only credits a completed lesson to the active daily-lesson quest", () => {
    expect(questProgressPlan({ event: "answer_submitted", quest: { key: "daily-lesson", target: 1 }, currentProgress: 0 })).toEqual({ shouldPersist: false, progress: 0, completed: false });
    expect(questProgressPlan({ event: "learning_session_completed", quest: { key: "daily-lesson", target: 1 }, currentProgress: 0 })).toEqual({ shouldPersist: true, progress: 1, completed: true });
  });

  it("only credits a completed boss to the weekly-battle quest", () => {
    expect(questProgressPlan({ event: "answer_submitted", quest: { key: "weekly-battle", target: 3 }, currentProgress: 1 })).toEqual({ shouldPersist: false, progress: 1, completed: false });
    expect(questProgressPlan({ event: "boss_completed", quest: { key: "weekly-battle", target: 3 }, currentProgress: 2 })).toEqual({ shouldPersist: true, progress: 3, completed: true });
  });
});
