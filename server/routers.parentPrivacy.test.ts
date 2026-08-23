import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const exportChildDataMock = vi.hoisted(() => vi.fn());

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  exportChildData: exportChildDataMock,
}));

import { appRouter } from "./routers";

function createParentContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "parent-user",
      email: "parent@example.com",
      name: "Parent",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected child-data export", () => {
  it("returns FORBIDDEN when the data layer rejects an export disabled by the parent", async () => {
    exportChildDataMock.mockRejectedValueOnce(
      new TRPCError({ code: "FORBIDDEN", message: "parent.exportDisabled" }),
    );
    const caller = appRouter.createCaller(createParentContext());

    await expect(caller.profile.exportChild({ childId: "7d9e2143-72a6-4a78-9bf4-d0302f538b3b" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "parent.exportDisabled",
    });
    expect(exportChildDataMock).toHaveBeenCalledWith(7, "7d9e2143-72a6-4a78-9bf4-d0302f538b3b");
  });
});
