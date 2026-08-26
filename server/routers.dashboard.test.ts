import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getChildDashboardMock = vi.hoisted(() => vi.fn());

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getChildDashboard: getChildDashboardMock,
}));

import { appRouter } from "./routers";

const parentContext = (): TrpcContext => ({
  user: { id: 7, openId: "parent-user", email: "parent@example.com", name: "Parent", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("protected child dashboard equipment read model", () => {
  it("returns equipped cosmetics and the active pet only through the authenticated child-dashboard procedure", async () => {
    const childId = "7d9e2143-72a6-4a78-9bf4-d0302f538b3b";
    getChildDashboardMock.mockResolvedValueOnce({ equippedCosmeticKeys: ["star-cape", "rainbow-hat"], equippedPetKey: "pico-owl" });

    await expect(appRouter.createCaller(parentContext()).learning.dashboard({ childId })).resolves.toMatchObject({
      equippedCosmeticKeys: ["star-cape", "rainbow-hat"],
      equippedPetKey: "pico-owl",
    });
    expect(getChildDashboardMock).toHaveBeenCalledWith(7, childId);
  });
});
