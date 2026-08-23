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
});
