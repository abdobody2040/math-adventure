import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const createBossQuestionMock = vi.hoisted(() => vi.fn());
const recordBossAnswerMock = vi.hoisted(() => vi.fn());

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  createBossQuestion: createBossQuestionMock,
  recordBossAnswer: recordBossAnswerMock,
}));

import { appRouter } from "./routers";

const parentContext = (): TrpcContext => ({
  user: { id: 7, openId: "parent-user", email: "parent@example.com", name: "Parent", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("protected boss flow", () => {
  const childId = "7d9e2143-72a6-4a78-9bf4-d0302f538b3b";
  const bossAttemptId = "d5ee0eae-0f83-4bb2-b99f-d626fccdd169";
  const questionSessionId = "48921d45-8f6d-45f8-b9b3-633463e80f73";

  it("returns an authored boss question through the protected session procedure", async () => {
    createBossQuestionMock.mockResolvedValueOnce({
      questionSessionId,
      expiresAt: new Date("2026-08-23T13:00:00Z"),
      skillKey: "times-tables",
      explanationKey: "feedback.multiplicationExplanation",
      healthRemaining: 100,
      presentation: { kind: "multiplication", interaction: "boss", bossTemplateKey: "boss-multiply-table", bossChallengeKey: "table", left: 4, right: 6, choices: ["20", "24", "28", "30"] },
    });

    const result = await appRouter.createCaller(parentContext()).learning.boss.nextQuestion({ childId, bossAttemptId });

    expect(createBossQuestionMock).toHaveBeenCalledWith(7, { childId, bossAttemptId });
    expect(result.presentation).toMatchObject({ interaction: "boss", bossTemplateKey: "boss-multiply-table", bossChallengeKey: "table" });
  });

  it("returns persisted health progression and completion state through the protected answer procedure", async () => {
    recordBossAnswerMock.mockResolvedValueOnce({ isCorrect: true, boss: { healthRemaining: 0, completed: true }, completionRewards: { xp: 60, coins: 25 } });

    const result = await appRouter.createCaller(parentContext()).learning.boss.submitAnswer({ childId, bossAttemptId, questionSessionId, answer: "24", responseTimeMs: 4200, usedHint: false });

    expect(recordBossAnswerMock).toHaveBeenCalledWith(7, { childId, bossAttemptId, questionSessionId, answer: "24", responseTimeMs: 4200, usedHint: false });
    expect(result).toMatchObject({ isCorrect: true, boss: { healthRemaining: 0, completed: true } });
  });
});
