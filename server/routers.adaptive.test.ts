import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getAdaptiveNextQuestionMock = vi.hoisted(() => vi.fn());
const createQuestionSessionMock = vi.hoisted(() => vi.fn());

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getAdaptiveNextQuestion: getAdaptiveNextQuestionMock,
  createQuestionSession: createQuestionSessionMock,
}));

import { appRouter } from "./routers";

const parentContext = (): TrpcContext => ({
  user: { id: 7, openId: "parent-user", email: "parent@example.com", name: "Parent", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("protected adaptive next question", () => {
  it("uses the server recommendation for skill, activity, and difficulty instead of the requested skill", async () => {
    const childId = "7d9e2143-72a6-4a78-9bf4-d0302f538b3b";
    getAdaptiveNextQuestionMock.mockResolvedValueOnce({ skillKey: "add-within-20", difficulty: 2, action: "remediate", activity: "guidedPractice" });
    createQuestionSessionMock.mockResolvedValueOnce({ id: "48921d45-8f6d-45f8-b9b3-633463e80f73", expiresAt: new Date("2026-08-23T13:00:00Z") });

    const result = await appRouter.createCaller(parentContext()).learning.nextQuestion({ childId, skillKey: "count-to-20" });

    expect(getAdaptiveNextQuestionMock).toHaveBeenCalledWith(7, { childId, requestedSkillKey: "count-to-20" });
    expect(createQuestionSessionMock).toHaveBeenCalledWith(7, childId, "add-within-20", expect.objectContaining({ activity: "guidedPractice" }), expect.any(String), expect.any(String));
    expect(result).toMatchObject({ adaptive: { skillKey: "add-within-20", difficulty: 2, action: "remediate", activity: "guidedPractice" }, presentation: { kind: "addition", activity: "guidedPractice" } });
  });
});
