import { describe, expect, it } from "vitest";
import { dashboardEquipmentProjection } from "./dashboardProjection";

describe("child dashboard equipment projection", () => {
  it("returns every equipped cosmetic and only the active pet for the protected child dashboard read model", () => {
    expect(dashboardEquipmentProjection([{ itemKey: "star-cape" }, { itemKey: "rainbow-hat" }], [{ petKey: "pico-owl" }, { petKey: "nova-fox" }])).toEqual({
      equippedCosmeticKeys: ["star-cape", "rainbow-hat"],
      equippedPetKey: "pico-owl",
    });
  });

  it("preserves an empty equipped state without inventing a cosmetic or pet", () => {
    expect(dashboardEquipmentProjection([], [])).toEqual({ equippedCosmeticKeys: [], equippedPetKey: null });
  });
});
