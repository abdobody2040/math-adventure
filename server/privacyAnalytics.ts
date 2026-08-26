type AnalyticsEventKey = "answer_submitted" | "session_started" | "boss_started" | "reward_redeemed" | "pet_unlocked";

export function safeAnalyticsPayload(eventKey: AnalyticsEventKey, input: Record<string, unknown>) {
  switch (eventKey) {
    case "answer_submitted": return { skillKey: String(input.skillKey ?? ""), isCorrect: Boolean(input.isCorrect), responseTimeMs: Number(input.responseTimeMs ?? 0), usedHint: Boolean(input.usedHint) };
    case "session_started": return { skillKey: String(input.skillKey ?? ""), mode: input.mode === "battle" ? "battle" : "lesson" };
    case "boss_started": return { worldKey: String(input.worldKey ?? "") };
    case "reward_redeemed": return { itemKey: String(input.itemKey ?? "") };
    case "pet_unlocked": return { petKey: String(input.petKey ?? "") };
  }
}

export function buildAggregateAnalytics(input: { activeChildren: number; attempts: { isCorrect: boolean }[]; events: { createdAt: Date }[]; publishedWorlds: number; publishedSkills: number }) {
  const correct = input.attempts.filter(item => item.isCorrect).length;
  const activityByDay = new Map<string, number>();
  for (const event of input.events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
  }
  return {
    activeChildren: input.activeChildren,
    attempts: input.attempts.length,
    accuracy: input.attempts.length ? Math.round(correct / input.attempts.length * 100) : 0,
    trackedEvents: input.events.length,
    publishedWorlds: input.publishedWorlds,
    publishedSkills: input.publishedSkills,
    recentActivity: Array.from(activityByDay.entries()).sort(([left], [right]) => left.localeCompare(right)).slice(-7).map(([day, count]) => ({ day, count })),
  };
}
