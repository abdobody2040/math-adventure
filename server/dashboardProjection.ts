type EquippedInventory = { itemKey: string };
type EquippedPet = { petKey: string };

export function dashboardEquipmentProjection(equippedInventoryRows: EquippedInventory[], equippedPetRows: EquippedPet[]) {
  return {
    equippedCosmeticKeys: equippedInventoryRows.map(item => item.itemKey),
    equippedPetKey: equippedPetRows[0]?.petKey ?? null,
  };
}
