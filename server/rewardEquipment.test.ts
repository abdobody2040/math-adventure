import { describe, expect, it } from "vitest";
import { inventoryEquipPlan, petEquipPlan } from "./rewardEquipment";

describe("reward equipment plans", () => {
  it("clears every item in the chosen category before equipping one cosmetic", () => {
    expect(inventoryEquipPlan(["star-cape", "star-cape", "cloud-cape"], "star-cape")).toEqual({ unequipItemKeys: ["star-cape", "cloud-cape"], equipItemKey: "star-cape" });
  });

  it("keeps exactly one active pet plan", () => {
    expect(petEquipPlan("pico-owl")).toEqual({ clearAllPets: true, equipPetKey: "pico-owl" });
  });
});
