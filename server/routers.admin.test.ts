import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUserContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin content access", () => {
  it("rejects a non-admin caller before any content mutation runs", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(caller.admin.seedStarterContent()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a non-admin caller before reading authoring content", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(caller.admin.content()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns authored content to an administrator", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));

    await expect(caller.admin.content()).resolves.toMatchObject({ worlds: expect.any(Array), skills: expect.any(Array), questionTemplates: expect.any(Array), quests: expect.any(Array), rewards: expect.any(Array) });
  });

  it("returns privacy-safe aggregate analytics to an administrator", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));

    await expect(caller.admin.analytics()).resolves.toMatchObject({ activeChildren: expect.any(Number), attempts: expect.any(Number), accuracy: expect.any(Number), recentActivity: expect.any(Array) });
  });

  it("allows an administrator to save existing authoring records without creating child data", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const content = await caller.admin.content();
    const world = content.worlds[0]!;
    const skill = content.skills[0]!;
    const template = content.questionTemplates[0]!;
    const quest = content.quests[0]!;
    const reward = content.rewards[0]!;

    await expect(caller.admin.saveWorld(world)).resolves.toEqual({ success: true });
    await expect(caller.admin.saveSkill(skill)).resolves.toEqual({ success: true });
    await expect(caller.admin.saveQuestionTemplate(template)).resolves.toEqual({ success: true });
    await expect(caller.admin.saveQuest(quest)).resolves.toEqual({ success: true });
    await expect(caller.admin.saveReward(reward)).resolves.toEqual({ success: true });
  });

  it("rejects a non-admin caller before changing a reward", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(caller.admin.saveReward({ key: "reward-test", titleKey: "inventory.rewardTest", category: "effect", costCoins: 0, assetKey: "reward-test", isPublished: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
