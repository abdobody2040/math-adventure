type QuestDefinition = { key: string; isDaily: boolean };

export function activeQuestForPeriod<T extends QuestDefinition>(quests: T[], isDaily: boolean, date: Date) {
  const candidates = quests.filter(quest => quest.isDaily === isDaily);
  if (!candidates.length) return undefined;
  const dayIndex = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const periodIndex = isDaily ? dayIndex : Math.floor((dayIndex - mondayOffset) / 7);
  return candidates[periodIndex % candidates.length];
}
