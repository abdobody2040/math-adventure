export function inventoryEquipPlan(categoryItemKeys: string[], selectedItemKey: string) {
  return {
    unequipItemKeys: Array.from(new Set(categoryItemKeys)),
    equipItemKey: selectedItemKey,
  };
}

export function petEquipPlan(selectedPetKey: string) {
  return { clearAllPets: true, equipPetKey: selectedPetKey };
}
